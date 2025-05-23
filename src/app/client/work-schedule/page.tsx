'use client'

import { getAllWorkSchedules, updateWorkLoadTime, WorkEpicEntity, WorkLoadEntity } from '@/app/actions/workschedule.action'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { useEffect, useRef, useState } from 'react'
import { DataGroup, DataItem, DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

type LooseWorkLoad = WorkLoadEntity & { epicId: string; epicTitle: string }

export default function WorkSchedulePage() {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplannedWorkLoads, setUnplannedWorkLoads] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)

  // 載入專案與未排班工作
  useEffect(() => {
    getAllWorkSchedules().then(epics => {
      setEpics(epics)
      const unplanned: LooseWorkLoad[] = []
      epics.forEach(e => {
        (e.workLoads || []).forEach(l => {
          if (!l.plannedStartTime) unplanned.push({ ...l, epicId: e.epicId, epicTitle: e.title })
        })
      })
      setUnplannedWorkLoads(unplanned)
    })
  }, [])

  // vis-timeline 初始化
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
    if (!timelineRef.current) return
    const gds = new DataSet<DataGroup>(groups)
    const ids = new DataSet<DataItem>(items)
    const tl = new Timeline(timelineRef.current, ids, gds, {
      editable: { updateTime: true, updateGroup: true, remove: false, add: false },
      stack: false,
      orientation: 'top',
      locale: 'zh-tw'
    })
    tl.on('move', async ({ item, start, end, group }) => {
      const d = ids.get(item as string)
      if (!d) return
      await updateWorkLoadTime(group || d.group, d.id as string, start.toISOString(), end ? end.toISOString() : null)
    })
    tl.on('drop', async function (props) {
      const data = props.event.dataTransfer?.getData('workload-id')
      const wl = unplannedWorkLoads.find(w => w.loadId === data)
      if (!wl) return
      const group = props.group
      const start = props.time
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      await updateWorkLoadTime(group, wl.loadId, start.toISOString(), end.toISOString())
      ids.add({
        id: wl.loadId,
        group,
        content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
        start: start.toISOString(),
        end: end.toISOString()
      })
      setUnplannedWorkLoads(prev => prev.filter(x => x.loadId !== wl.loadId))
    })
    timelineRef.current.ondrop = e => e.preventDefault()
    timelineRef.current.ondragover = e => e.preventDefault()
    return () => tl.destroy()
  }, [epics, unplannedWorkLoads])

  // 拖曳事件
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => {
    e.dataTransfer.setData('workload-id', wl.loadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex h-screen">
      {/* 未排班清單 */}
      <div className="w-64 border-r p-2 h-full bg-white">
        <div className="font-bold mb-2">未排班工作</div>
        <div className="flex flex-col gap-2">
          {unplannedWorkLoads.length === 0 && <div className="text-gray-400">（無）</div>}
          {unplannedWorkLoads.map(wl =>
            <div
              key={wl.loadId}
              className="cursor-move bg-yellow-50 border rounded px-2 py-1 text-sm hover:bg-yellow-100"
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
      {/* Timeline */}
      <div className="flex-1 h-full flex flex-col">
        <div className="border rounded-lg p-4 m-4 flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
          <div ref={timelineRef} className="h-[400px] w-full flex-1" />
        </div>
        <ClientBottomNav />
      </div>
    </div>
  )
}