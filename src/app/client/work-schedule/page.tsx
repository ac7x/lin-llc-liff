'use client'

import {
  getAllWorkSchedules,
  updateWorkLoadTime,
  WorkEpicEntity,
  WorkLoadEntity,
} from '@/app/actions/workschedule.action'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, startOfDay } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { DataGroup, DataItem, DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

type LooseWorkLoad = WorkLoadEntity & { epicId: string; epicTitle: string }

const toStr = (v: string | number): string => typeof v === 'string' ? v : String(v)

export default function WorkSchedulePage() {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const timelineInstance = useRef<Timeline | null>(null)
  const itemsDataSet = useRef<DataSet<DataItem> | null>(null)

  useEffect(() => {
    getAllWorkSchedules().then((epics) => {
      setEpics(epics)
      const unplanned: LooseWorkLoad[] = []
      epics.forEach(e => {
        (e.workLoads || []).forEach(l => {
          if (!l.plannedStartTime) {
            unplanned.push({ ...l, epicId: e.epicId, epicTitle: e.title })
          }
        })
      })
      setUnplanned(unplanned)
    })
  }, [])

  useEffect(() => {
    if (!epics.length || !timelineRef.current) return

    const groups = epics.map(e => ({
      id: e.epicId,
      content: e.title
    }))
    const items = epics.flatMap(e =>
      (e.workLoads || [])
        .filter(l => l.plannedStartTime)
        .map(l => ({
          id: l.loadId,
          group: e.epicId,
          content: l.title || '(無標題)',
          start: new Date(l.plannedStartTime!),
          end: l.plannedEndTime ? new Date(l.plannedEndTime) : undefined,
          type: 'range' as const
        }))
    )

    const gds = new DataSet<DataGroup>(groups)
    const ids = new DataSet<DataItem>(items)
    itemsDataSet.current = ids
    const tl = new Timeline(timelineRef.current, ids, gds, {
      stack: true,
      orientation: 'top',
      editable: { updateTime: true, updateGroup: true, remove: false, add: false },
      locale: 'zh-tw'
    })
    timelineInstance.current = tl

    tl.on('move', async ({ item, start, end, group }: { item: string | number, start: Date, end: Date, group: string | number }) => {
      const d = ids.get(item)
      const dataItem = Array.isArray(d) ? d[0] : d
      if (!dataItem) return
      const epicId = toStr(group ?? dataItem.group)
      const loadId = toStr(dataItem.id)
      await updateWorkLoadTime(epicId, loadId, start.toISOString(), end ? end.toISOString() : null)
      ids.update({ id: dataItem.id, start, end })
    })

    const handleResize = () => tl.redraw()
    window.addEventListener('resize', handleResize)
    return () => {
      tl.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [epics])

  useEffect(() => {
    const ref = timelineRef.current
    if (!ref || !timelineInstance.current || !itemsDataSet.current) return

    const handleDragOver = (e: DragEvent) => e.preventDefault()
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      try {
        const payload = JSON.parse(e.dataTransfer?.getData('text') || '{}')
        const point = timelineInstance.current!.getEventProperties(e)
        if (!point.time) return
        const wl = unplanned.find(w => w.loadId === payload.id)
        if (!wl) return
        const groupId = toStr(point.group ?? wl.epicId)
        const start = startOfDay(point.time)
        const end = addDays(start, 1)
        updateWorkLoadTime(groupId, wl.loadId, start.toISOString(), end.toISOString()).then(() => {
          itemsDataSet.current!.add({
            id: wl.loadId,
            group: groupId,
            content: wl.title || '(無標題)',
            start,
            end,
            type: 'range'
          })
          setUnplanned(prev => prev.filter(x => x.loadId !== wl.loadId))
        })
      } catch { /* ignore */ }
    }
    ref.addEventListener('dragover', handleDragOver)
    ref.addEventListener('drop', handleDrop)
    return () => {
      ref.removeEventListener('dragover', handleDragOver)
      ref.removeEventListener('drop', handleDrop)
    }
  }, [unplanned, epics])

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text', JSON.stringify({ id: wl.loadId }))
  }

  return (
    <div className="w-full min-h-screen bg-black flex flex-col" style={{ position: 'relative' }}>
      <div className="flex-none h-[20vh]" />
      <div className="flex-none h-[60vh] w-full flex items-center justify-center px-2">
        <div className="w-full h-full rounded-xl bg-white shadow overflow-hidden" style={{ maxWidth: 1200 }} ref={timelineRef} />
      </div>
      <div className="flex-none h-[20vh] w-full bg-gray-50 px-2 py-1 overflow-x-auto" style={{ zIndex: 10 }}>
        <div className="flex gap-2 justify-center items-end h-full">
          {unplanned.length === 0 &&
            (<div className="text-gray-400 text-sm">（無未排班工作）</div>)}
          {unplanned.map(wl => (
            <div
              key={wl.loadId}
              className="cursor-move border rounded px-2 py-1 text-xs bg-yellow-50 hover:bg-yellow-100 truncate"
              draggable
              onDragStart={e => onDragStart(e, wl)}
              title={wl.epicTitle}
              style={{ minWidth: 90, maxWidth: 120 }}
            >
              <div className="truncate font-semibold">{wl.title || '(無標題)'}</div>
              <div className="text-gray-400 truncate">{wl.executor?.join(', ') || '(無執行者)'}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 20 }}>
        <ClientBottomNav />
      </div>
    </div>
  )
}