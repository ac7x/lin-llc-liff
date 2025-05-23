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
      stack: true,
      orientation: 'top',
      editable: { updateTime: true, updateGroup: true, remove: false, add: true },
      locale: 'zh-tw',
      tooltip: { followMouse: true },
      zoomMin: 24 * 60 * 60 * 1000,
      zoomMax: 90 * 24 * 60 * 60 * 1000
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
        const { item, callback: cb } = props
        const payload: { id: string } = JSON.parse(item.content as string)
        const wl = unplanned.find(w => w.loadId === payload.id)
        if (!wl) return cb(null)
        const start = item.start ? new Date(item.start) : new Date()
        const end = item.end ? new Date(item.end) : addDays(start, 1)
        const obj: TimelineItem = {
          id: wl.loadId,
          group: item.group || epics[0].epicId,
          content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
          start,
          end,
          type: 'range'
        }
        cb(obj)
        const updatedWorkLoad = await updateWorkLoadTime(String(obj.group), String(wl.loadId), start.toISOString(), end.toISOString())
        if (updatedWorkLoad) {
          setEpics(prev =>
            prev.map(epic =>
              updatedWorkLoad.epicIds?.includes(epic.epicId)
                ? { ...epic, workLoads: (epic.workLoads || []).map(load => load.loadId === updatedWorkLoad.loadId ? updatedWorkLoad : load) }
                : epic
            )
          )
          setUnplanned(prev => prev.filter(x => x.loadId !== wl.loadId))
        }
      } catch (err) { console.error('新增工作負載失敗:', err) }
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

      try {
        const updatedWorkLoad = await updateWorkLoadTime(
          group || item.group,
          item.id,
          newStart.toISOString(),
          newEnd.toISOString()
        )

        // 確認移動並更新畫面上的項目
        if (callback) {
          // 使用類型轉換確保類型正確
          const updatedItem: TimelineItem = {
            id: item.id,
            content: item.content as string,
            start: newStart,
            end: newEnd,
            group: group || item.group,
            type: item.type as any // 轉換為正確的 TimelineItemType
          }
          callback(updatedItem)
        }

        if (updatedWorkLoad) {
          setEpics(prev =>
            prev.map(epic =>
              updatedWorkLoad.epicIds?.includes(epic.epicId)
                ? { ...epic, workLoads: (epic.workLoads || []).map(load => load.loadId === updatedWorkLoad.loadId ? updatedWorkLoad : load) }
                : epic
            )
          )
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