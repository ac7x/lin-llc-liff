'use client'

import { getAllWorkSchedules, updateWorkLoadTime, WorkEpicEntity } from '@/app/actions/workschedule.action'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { useEffect, useRef, useState } from 'react'
import { DataGroup, DataItem, DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

export default function WorkSchedulePage() {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const [groupsDS, setGroupsDS] = useState<DataSet<DataGroup> | null>(null)
  const [itemsDS, setItemsDS] = useState<DataSet<DataItem> | null>(null)

  useEffect(() => { getAllWorkSchedules().then(setEpics) }, [])

  useEffect(() => {
    if (!epics.length) return
    const groups = epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` }))
    const items = epics.flatMap(e => (e.workLoads || []).map(l => ({
      id: l.loadId,
      group: e.epicId,
      content: `<div><div>${l.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(l.executor) ? l.executor.join(', ') : l.executor || '(無執行者)'}</div></div>`,
      start: l.plannedStartTime, end: l.plannedEndTime || undefined
    })))
    const gds = new DataSet<DataGroup>(groups)
    const ids = new DataSet<DataItem>(items)
    setGroupsDS(gds)
    setItemsDS(ids)
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
    return () => tl.destroy()
  }, [epics])

  return (
    <>
      <div className="border rounded-lg p-4 m-4">
        <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
        <div className="flex gap-2 mb-2">
          <button onClick={() => {
            if (!groupsDS) return
            const name = window.prompt('請輸入新專案標的名稱：')
            if (!name) return
            groupsDS.add({ id: 'epic-' + Date.now(), content: `<b>${name}</b>` })
          }} className="px-2 py-1 bg-blue-500 text-white rounded">新增標的</button>
          <button onClick={() => {
            if (!groupsDS) return
            const id = window.prompt('請輸入要刪除的 epicId：')
            if (!id) return
            groupsDS.remove(id)
            if (itemsDS) {
              itemsDS.forEach(i => {
                if (i.group === id) itemsDS.remove(i.id as string)
              })
            }
          }} className="px-2 py-1 bg-red-500 text-white rounded">刪除標的</button>
          <button onClick={() => {
            if (!groupsDS) return
            const id = window.prompt('請輸入要改名的 epicId：')
            if (!id) return
            const g = groupsDS.get(id)
            if (!g) return
            const str = typeof g.content === 'string' ? g.content.replace(/<[^>]*>/g, '') : ''
            const name = window.prompt('新名稱：', str)
            if (!name) return
            groupsDS.update({ id, content: `<b>${name}</b>` })
          }} className="px-2 py-1 bg-yellow-500 text-black rounded">改名標的</button>
        </div>
        <div ref={timelineRef} className="h-[400px] w-full" />
      </div>
      <ClientBottomNav />
    </>
  )
}