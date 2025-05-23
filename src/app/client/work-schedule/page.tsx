'use client'

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { DataGroup, DataItem, DataSet, Timeline, TimelineItem, TimelineOptions } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { WorkEpicEntity, WorkLoadEntity } from './types'
import { useTimelineListeners } from './use-timeline-listeners'
import { getAllWorkSchedules, updateWorkLoadTime } from './workschedule.action'

type LooseWorkLoad = WorkLoadEntity & { epicId: string, epicTitle: string }
type WorkLoadDataItem = DataItem & { id: string, group: string, start: Date, end?: Date }

const WorkSchedulePage = () => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const [timelineInstance, setTimelineInstance] = useState<Timeline | null>(null)
  const itemsDataSet = useRef<DataSet<WorkLoadDataItem> | null>(null)

  useEffect(() => {
    (async () => {
      const epicList = await getAllWorkSchedules()
      setEpics(epicList)
      setUnplanned(
        epicList.flatMap(e =>
          (e.workLoads || [])
            .filter(l => !l.plannedStartTime)
            .map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
        )
      )
    })()
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
      editable: { updateTime: true, updateGroup: true, remove: false, add: true, overrideItems: false },
      snap: date => startOfDay(date),
      stack: true,
      clickToUse: false,
      height: '100%',
      locale: 'zh-tw',
      tooltip: { followMouse: true, overflowMethod: 'cap' },
      zoomMin: 24 * 60 * 60 * 1000,
      zoomMax: 90 * 24 * 60 * 60 * 1000,
      showCurrentTime: true,
      type: 'range'
    }
    const tl = new Timeline(timelineRef.current, items, groups, options)
    setTimelineInstance(tl)
    const handleResize = () => tl.redraw()
    window.addEventListener('resize', handleResize)
    return () => { tl.destroy(); window.removeEventListener('resize', handleResize) }
  }, [epics])

  useTimelineListeners({
    timeline: timelineInstance,
    onAdd: async ({ item, callback }) => {
      try {
        const payload = JSON.parse(item.content as string) as { id: string }
        const wl = unplanned.find(w => w.loadId === payload.id)
        if (!wl) return callback(null)
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
        callback(obj)
        const epicIds = [...(wl.epicIds || [])]
        if (!epicIds.includes(String(obj.group))) epicIds.push(String(obj.group))
        const updatedWorkLoad = await updateWorkLoadTime(
          String(obj.group),
          String(wl.loadId),
          start.toISOString(),
          end.toISOString(),
          epicIds,
          3
        )
        if (updatedWorkLoad) {
          const updatedEpic = {
            ...epics.find(e => e.epicId === String(obj.group)),
            workLoads: [
              ...(epics.find(e => e.epicId === String(obj.group))?.workLoads || []).filter(w => w.loadId !== updatedWorkLoad.loadId),
              updatedWorkLoad
            ]
          } as WorkEpicEntity
          setEpics(prev =>
            prev.map(epic =>
              epic.epicId === String(obj.group) ? updatedEpic : epic
            )
          )
          setUnplanned(prev => prev.filter(x => x.loadId !== wl.loadId))
        }
      } catch { callback(null) }
    },
    onMove: async ({ item: itemId, start, end, group, callback }) => {
      if (!itemsDataSet.current) return callback?.(null)
      const item = itemsDataSet.current.get(itemId as string)
      if (!item) return callback?.(null)
      const newStart = startOfDay(start)
      const duration = end ? Math.max(1, differenceInCalendarDays(end, start)) : 1
      const newEnd = addDays(newStart, duration)
      const updatedItem: TimelineItem = {
        id: item.id,
        content: item.content as string,
        start: newStart,
        end: newEnd,
        group: group || item.group,
        type: 'range'
      }
      callback?.(updatedItem)
      try {
        const oldEpicId = item.group as string
        const newEpicId = group || oldEpicId
        const oldWorkload = epics.find(e => e.epicId === oldEpicId)?.workLoads?.find(w => w.loadId === item.id)
        const epicIds = [...(oldWorkload?.epicIds || [])]
        if (!epicIds.includes(newEpicId)) epicIds.push(newEpicId)
        const updatedWorkLoad = await updateWorkLoadTime(
          newEpicId,
          item.id as string,
          newStart.toISOString(),
          newEnd.toISOString(),
          epicIds,
          3
        )
        if (updatedWorkLoad) {
          setEpics(prev => {
            const newState = [...prev]
            if (oldEpicId !== newEpicId) {
              const oldEpicIndex = newState.findIndex(e => e.epicId === oldEpicId)
              if (oldEpicIndex !== -1 && newState[oldEpicIndex].workLoads)
                newState[oldEpicIndex].workLoads = newState[oldEpicIndex].workLoads.filter(w => w.loadId !== updatedWorkLoad.loadId)
            }
            const newEpicIndex = newState.findIndex(e => e.epicId === newEpicId)
            if (newEpicIndex !== -1) {
              if (!newState[newEpicIndex].workLoads) newState[newEpicIndex].workLoads = []
              const existingIndex = newState[newEpicIndex].workLoads.findIndex(w => w.loadId === updatedWorkLoad.loadId)
              if (existingIndex !== -1) newState[newEpicIndex].workLoads[existingIndex] = updatedWorkLoad
              else newState[newEpicIndex].workLoads.push(updatedWorkLoad)
            }
            return newState
          })
        }
      } catch { callback?.(null) }
    }
  })

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: wl.loadId,
      type: 'range',
      content: JSON.stringify({ id: wl.loadId }),
      group: wl.epicId,
      start: new Date(),
      end: addDays(new Date(), 1)
    }))
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