'use client'

import { getAllWorkSchedules, updateWorkLoadTime, WorkEpicEntity, WorkLoadEntity } from '@/app/actions/workschedule.action'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import classNames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import { DataGroup, DataItem, DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

type LooseWorkLoad = WorkLoadEntity & { epicId: string; epicTitle: string }

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
    const items = epics.flatMap(e => (e.workLoads || []).filter(l => l.plannedStartTime).map(l => ({
      id: l.loadId,
      group: e.epicId,
      content: `<div><div>${l.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(l.executor) ? l.executor.join(', ') : l.executor || '(無執行者)'}</div></div>`,
      start: l.plannedStartTime,
      end: l.plannedEndTime || undefined
    })))
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
      await updateWorkLoadTime(group || d.group, d.id as string, start.toISOString(), end ? end.toISOString() : null, { toCache: true, toFirestore: false })
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
      await updateWorkLoadTime(group, wl.loadId, start.toISOString(), end.toISOString(), { toCache: true, toFirestore: false })
      ids.add({
        id: wl.loadId,
        group,
        content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
        start: start.toISOString(),
        end: end.toISOString()
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
    <div className="flex">
      {/* 未排班清單 */}
      <div className="w-64 border-r p-2">
        <div className="font-bold mb-2">未排班工作</div>
        <div className="flex flex-col gap-2">
          {unplannedWorkLoads.length === 0 && <div className="text-gray-400">（無）</div>}
          {unplannedWorkLoads.map(wl =>
            <div
              key={wl.loadId}
              className={classNames("cursor-move bg-yellow-50 border rounded px-2 py-1 text-sm hover:bg-yellow-100")}
              draggable
              onDragStart={e => onDragStart(e, wl)}
              title={`來自 ${wl.epicTitle}`}
            >
              <div>{wl.title || '(無標題)'}</div>
              <div className="text-xs text-gray-400">{wl.executor?.join(', ') || '(無執行者)'}</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="border rounded-lg p-4 m-4">
          <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
          <div ref={timelineRef} className="h-[400px] w-full" />
        </div>
        <ClientBottomNav />
      </div>
    </div>
  )
}