'use client'

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { DataGroup, DataItem, DataSet, Timeline, TimelineItem, TimelineOptions } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { TimelineAddEventProps, TimelineMoveEventProps, WorkEpicEntity, WorkLoadEntity } from './types'
import { useTimelineListeners } from './use-timeline-listeners'
import { getAllWorkSchedules, updateWorkLoadTime } from './workschedule.action'

type LooseWorkLoad = WorkLoadEntity & { epicId: string, epicTitle: string }
type DraggableItem = { id: string, type: 'range', content: string, group: string, start: Date, end: Date }
interface WorkLoadDataItem extends DataItem {
  id: string
  group: string
  start: Date
  end?: Date
}

const WorkSchedulePage = () => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const [timelineInstance, setTimelineInstance] = useState<Timeline | null>(null)
  const itemsDataSet = useRef<DataSet<WorkLoadDataItem> | null>(null)

  // 取得資料：直接從 Redis 拿
  useEffect(() => {
    const fetchData = async () => {
      const epicList = await getAllWorkSchedules()
      setEpics(epicList)
      setUnplanned(
        epicList.flatMap(e =>
          (e.workLoads || [])
            .filter(l => !l.plannedStartTime)
            .map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
        )
      )
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!timelineRef.current || !epics.length) return

    const groups = new DataSet<DataGroup>(epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` })))
    const items = new DataSet<WorkLoadDataItem>(
      epics.flatMap(e =>
        (e.workLoads || [])
          .filter(l => l.plannedStartTime)
          .map(l => ({
            id: l.loadId,
            group: e.epicId,
            type: 'range',
            content: `<div><div>${l.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(l.executor) ? l.executor.join(', ') : l.executor || '(無執行者)'}</div></div>`,
            start: new Date(l.plannedStartTime),
            end: l.plannedEndTime ? new Date(l.plannedEndTime) : undefined
          }))
      )
    )
    itemsDataSet.current = items

    const options: TimelineOptions = {
      orientation: 'top',
      editable: {
        updateTime: true,
        updateGroup: true,
        remove: false,
        add: true,
        overrideItems: false  // 允許項目級別的設定覆蓋
      },
      // 自訂遊標吸附函數 - 讓項目按天對齊
      snap: (date, _scale, _step) => {
        // vis-timeline需要這些參數，但我們只用date
        return startOfDay(date)
      },
      // 確保項目之間不會重疊
      stack: true,
      // 點擊即使用
      clickToUse: false,
      // 支援拖放
      height: '100%',
      locale: 'zh-tw',
      tooltip: {
        followMouse: true,
        overflowMethod: 'cap'
      },
      zoomMin: 24 * 60 * 60 * 1000, // 最小縮放為1天
      zoomMax: 90 * 24 * 60 * 60 * 1000, // 最大縮放為90天
      // 顯示當前時間線
      showCurrentTime: true,
      // 設置項目默認類型
      type: 'range'
    }

    const tl = new Timeline(timelineRef.current, items, groups, options)
    setTimelineInstance(tl)

    const handleResize = () => tl.redraw()
    window.addEventListener('resize', handleResize)
    return () => {
      tl.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [epics])

  useTimelineListeners({
    timeline: timelineInstance,
    onAdd: async (props: TimelineAddEventProps) => {
      try {
        const { item, callback } = props
        let payload: { id: string };

        try {
          // 嘗試解析拖曳的內容
          payload = JSON.parse(item.content as string);
          if (!payload || !payload.id) {
            console.error('無效的拖曳項目資料');
            return callback(null);
          }
        } catch (parseError) {
          console.error('解析拖曳項目資料失敗:', parseError);
          return callback(null);
        }

        // 找到對應的未排程工作負載
        const wl = unplanned.find(w => w.loadId === payload.id)
        if (!wl) {
          console.error(`找不到工作負載 ID: ${payload.id}`);
          return callback(null);
        }

        // 計算開始和結束時間
        const start = item.start ? new Date(item.start) : new Date()
        const end = item.end ? new Date(item.end) : addDays(start, 1)

        // 建立時間軸上的項目
        const obj: TimelineItem = {
          id: wl.loadId,
          group: item.group || epics[0].epicId,
          content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
          start,
          end,
          type: 'range'
        }

        // 先確認更新 UI
        callback(obj)

        try {
          // 確保workLoad有epicIds屬性，且包含新的群組ID
          const epicIds = [...(wl.epicIds || [])];
          if (!epicIds.includes(String(obj.group))) {
            epicIds.push(String(obj.group));
          }

          // 嘗試更新資料庫，並帶上正確的epicIds
          const updatedWorkLoad = await updateWorkLoadTime(
            String(obj.group),
            String(wl.loadId),
            start.toISOString(),
            end.toISOString(),
            epicIds, // 添加epicIds參數
            3 // 重試3次
          )

          if (updatedWorkLoad) {
            // 更新本地狀態 - 深拷貝以避免引用問題
            const updatedEpic = JSON.parse(JSON.stringify({
              ...epics.find(e => e.epicId === String(obj.group)),
              workLoads: [
                ...(epics.find(e => e.epicId === String(obj.group))?.workLoads || []).filter(w => w.loadId !== updatedWorkLoad.loadId),
                updatedWorkLoad
              ]
            }));

            setEpics(prev =>
              prev.map(epic =>
                epic.epicId === String(obj.group) ? updatedEpic : epic
              )
            )

            // 從未排程列表中移除
            setUnplanned(prev => prev.filter(x => x.loadId !== wl.loadId))
          }
        } catch (dbError) {
          console.error('更新資料庫失敗:', dbError);
          // 資料庫更新失敗，但UI已更新 - 可以考慮提醒使用者刷新頁面
          // 或實作一個回滾機制
          if (itemsDataSet.current) {
            try {
              itemsDataSet.current.remove(String(wl.loadId));
            } catch (removeError) {
              console.error('無法從時間軸移除失敗的項目:', removeError);
            }
          }
        }
      } catch (err) {
        console.error('新增工作負載失敗:', err);
        props.callback(null); // 確保取消操作
      }
    },
    onMove: async (props: TimelineMoveEventProps) => {
      const { item: itemId, start, end, group, callback } = props
      if (!itemsDataSet.current) {
        if (callback) callback(null)
        return
      }

      const item = itemsDataSet.current.get(itemId as string)
      if (!item) {
        if (callback) callback(null)
        return
      }

      const newStart = startOfDay(start)
      const duration = end ? Math.max(1, differenceInCalendarDays(end, start)) : 1
      const newEnd = addDays(newStart, duration)

      // 使用類型轉換確保類型正確
      const updatedItem: TimelineItem = {
        id: item.id,
        content: item.content as string,
        start: newStart,
        end: newEnd,
        group: group || item.group,
        type: 'range'
      }

      // 先更新畫面反應，立即得到反饋
      if (callback) {
        callback(updatedItem)
      }

      try {
        // 查詢現有的epicIds並確保包含新舊群組
        const oldEpicId = item.group as string;
        const newEpicId = group || oldEpicId;

        // 獲取現有的workload數據以提取epicIds
        const oldWorkload = epics
          .find(e => e.epicId === oldEpicId)?.workLoads
          ?.find(w => w.loadId === item.id as string);

        let epicIds = [...(oldWorkload?.epicIds || [])];

        // 確保包含新的epicId
        if (!epicIds.includes(newEpicId)) {
          epicIds.push(newEpicId);
        }

        // 再嘗試更新資料庫
        const updatedWorkLoad = await updateWorkLoadTime(
          newEpicId,
          item.id as string,
          newStart.toISOString(),
          newEnd.toISOString(),
          epicIds,
          3 // 重試 3 次
        )

        if (updatedWorkLoad) {
          // 處理跨群組拖曳的情況
          const oldEpicId = item.group;
          const newEpicId = group || oldEpicId;

          // 正確更新 epics，處理跨群組拖曳
          setEpics(prev => {
            // 建立一個深拷貝，避免直接修改狀態
            const newState = JSON.parse(JSON.stringify(prev)) as WorkEpicEntity[];

            // 如果是跨群組拖曳，先從原始群組移除
            if (oldEpicId !== newEpicId) {
              const oldEpicIndex = newState.findIndex(e => e.epicId === oldEpicId);
              if (oldEpicIndex !== -1 && newState[oldEpicIndex].workLoads) {
                newState[oldEpicIndex].workLoads = newState[oldEpicIndex].workLoads.filter(
                  w => w.loadId !== updatedWorkLoad.loadId
                );
              }
            }

            // 在新群組中新增或更新
            const newEpicIndex = newState.findIndex(e => e.epicId === newEpicId);
            if (newEpicIndex !== -1) {
              if (!newState[newEpicIndex].workLoads) {
                newState[newEpicIndex].workLoads = [];
              }

              const existingIndex = newState[newEpicIndex].workLoads.findIndex(
                w => w.loadId === updatedWorkLoad.loadId
              );

              if (existingIndex !== -1) {
                // 更新現有的工作負載
                newState[newEpicIndex].workLoads[existingIndex] = updatedWorkLoad;
              } else {
                // 添加新的工作負載
                newState[newEpicIndex].workLoads.push(updatedWorkLoad);
              }
            }

            return newState;
          })
        }
      } catch (err) {
        console.error('更新工作負載時間失敗:', err)
        if (callback) callback(null) // 發生錯誤時取消移動
      }
    }
  })

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => {
    const dragItem: DraggableItem = {
      id: wl.loadId,
      type: 'range',
      content: JSON.stringify({ id: wl.loadId }),
      group: wl.epicId,
      start: new Date(),
      end: addDays(new Date(), 1)
    }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(dragItem))
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <div className="flex-none h-[20vh]" />
      <div className="flex-none h-[60vh] w-full flex items-center justify-center">
        <div
          className="w-full h-full rounded-2xl bg-white border border-gray-300 shadow overflow-hidden"
          ref={timelineRef}
          style={{ minWidth: '100vw' }}
        />
      </div>
      <div className="flex-none h-[20vh] w-full bg-black px-4 py-2 overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <h2 className="text-lg font-bold text-center text-white mb-2">未排班工作</h2>
          <div className="flex flex-wrap gap-2 justify-center overflow-auto max-h-full">
            {unplanned.length === 0 ? (
              <div className="text-gray-400">（無）</div>
            ) : unplanned.map(wl => (
              <div
                key={wl.loadId}
                className="cursor-move bg-yellow-50 border rounded px-3 py-2 text-sm hover:bg-yellow-100 flex items-center"
                draggable
                onDragStart={e => onDragStart(e, wl)}
                title={`來自 ${wl.epicTitle}`}
              >
                <span className="mr-2 select-none">≣</span>
                <div>
                  <div>{wl.title || '(無標題)'}</div>
                  <div className="text-xs text-gray-400">
                    {Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ClientBottomNav />
    </div>
  )
}

export default WorkSchedulePage