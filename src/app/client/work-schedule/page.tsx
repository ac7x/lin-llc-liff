'use client'

import { getAllWorkSchedules, updateWorkLoadTime, WorkEpicEntity, WorkLoadEntity } from '@/app/actions/workschedule.action'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import classNames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import { DataGroup, DataItem, DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

type LooseWorkLoad = WorkLoadEntity & { epicId: string; epicTitle: string }

// 工具函式：Date 轉 YYYY-MM-DD
function toYMD(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default function WorkSchedulePage() {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplannedWorkLoads, setUnplannedWorkLoads] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)

  // 取得所有專案與工作負載
  useEffect(() => {
    getAllWorkSchedules().then(epics => {
      setEpics(epics)
      const unplanned: LooseWorkLoad[] = []
      epics.forEach(e => {
        (e.workLoads || []).forEach(l => {
          if (!l.plannedStartTime) {
            unplanned.push({ ...l, epicId: e.epicId, epicTitle: e.title })
          }
        })
      })
      setUnplannedWorkLoads(unplanned)
    })
  }, [])

  // 初始化 timeline
  useEffect(() => {
    if (!epics.length) return
    const groups = epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` }))
    const items = epics.flatMap(e =>
      (e.workLoads || [])
        .filter(l => l.plannedStartTime)
        .map(l => ({
          id: l.loadId,
          group: e.epicId,
          content: `<div><div>${l.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(l.executor) ? l.executor.join(', ') : l.executor || '(無執行者)'}</div></div>`,
          start: l.plannedStartTime,
          end: l.plannedEndTime || undefined
        }))
    )
    const gds = new DataSet<DataGroup>(groups)
    const ids = new DataSet<DataItem>(items)

    if (!timelineRef.current) return

    const tl = new Timeline(timelineRef.current, ids, gds, {
      stack: false,
      orientation: 'top',
      editable: { updateTime: true, updateGroup: true, remove: false, add: false },
      locale: 'zh-tw',
      tooltip: { followMouse: true }
    })

    tl.on('move', async ({ item, start, end, group }) => {
      const d = ids.get(item as string)
      if (!d) return
      // 轉成 YYYY-MM-DD 存
      await updateWorkLoadTime(
        group || d.group,
        d.id as string,
        toYMD(start),
        end ? toYMD(end) : null,
        { toCache: true, toFirestore: false }
      )
    })

    // 支援外部拖放
    tl.on('itemover', function () {
      // highlight...
    })

    tl.on('drop', async function (props) {
      const data = props.event.dataTransfer?.getData('workload-id')
      if (!data) return
      const wl = unplannedWorkLoads.find(w => w.loadId === data)
      if (!wl) return
      const group = props.group
      const start = props.time
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      // 存成 YYYY-MM-DD 格式
      await updateWorkLoadTime(
        group,
        wl.loadId,
        toYMD(start),
        toYMD(end),
        { toCache: true, toFirestore: false }
      )
      ids.add({
        id: wl.loadId,
        group,
        content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
        start: toYMD(start),
        end: toYMD(end)
      })
      setUnplannedWorkLoads(prev => prev.filter(x => x.loadId !== wl.loadId))
    })

    if (timelineRef.current) {
      timelineRef.current.ondrop = function (e) {
        e.preventDefault()
      }
      timelineRef.current.ondragover = function (e) {
        e.preventDefault()
      }
    }

    return () => tl.destroy()
  }, [epics, unplannedWorkLoads])

  // 拖曳事件
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => {
    e.dataTransfer.setData('workload-id', wl.loadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Timeline區，最大化 */}
      <div className="flex-1 relative bg-white">
        <div
          ref={timelineRef}
          className="absolute inset-0"
          style={{ minHeight: 0 }}
        />
      </div>
      {/* 未排班卡片區，橫向捲動 */}
      <div className="w-full bg-gray-50 border-t h-24 flex items-center overflow-x-auto px-2 space-x-2">
        {unplannedWorkLoads.length === 0 && (
          <div className="text-gray-400 text-sm ml-2">（無未排班工作）</div>
        )}
        {unplannedWorkLoads.map(wl =>
          <div
            key={wl.loadId}
            className={classNames(
              "cursor-move bg-yellow-50 border rounded px-2 py-1 text-xs hover:bg-yellow-100 leading-tight shadow-sm flex-shrink-0"
            )}
            style={{ minWidth: 100, maxWidth: 160 }}
            draggable
            onDragStart={e => onDragStart(e, wl)}
            title={`來自 ${wl.epicTitle}`}
          >
            <div className="truncate">{wl.title || '(無標題)'}</div>
            <div className="text-[10px] text-gray-400 truncate">{wl.executor?.join(', ') || '(無執行者)'}</div>
          </div>
        )}
      </div>
      {/* 底部導覽條 */}
      <ClientBottomNav />
    </div>
  )
}