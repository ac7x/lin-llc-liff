'use client'

import {
  updateWorkLoadTime,
  WorkEpicEntity,
  WorkLoadEntity
} from '@/app/actions/workschedule.action'
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { collection } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { DataGroup, DataItem, DataSet, Timeline, TimelineItem, TimelineOptions } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

type LooseWorkLoad = WorkLoadEntity & { epicId: string, epicTitle: string }

interface DraggableItem {
  id: string
  type: 'range'
  content: string
  group: string
  start: Date
  end: Date
}

const WorkSchedulePage = () => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstance = useRef<Timeline | null>(null)
  const itemsDataSet = useRef<DataSet<DataItem> | null>(null)

  const [epicSnapshot] = useCollection(
    collection(firestore, 'workEpic')
  )

  useEffect(() => {
    if (!epicSnapshot) return
    const epicList = epicSnapshot.docs.map(doc => ({
      ...doc.data(),
      epicId: doc.id
    })) as WorkEpicEntity[]
    setEpics(epicList)
    setUnplanned(
      epicList.flatMap(e =>
        (e.workLoads || [])
          .filter(l => !l.plannedStartTime)
          .map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
      )
    )
  }, [epicSnapshot])

  useEffect(() => {
    if (!timelineRef.current || !epics.length) return
    const groups = new DataSet<DataGroup>(
      epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` }))
    )
    const items = new DataSet<DataItem>(
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
      zoomMax: 90 * 24 * 60 * 60 * 1000,
      onAdd: async (item, cb) => {
        try {
          const payload: { id: string } = JSON.parse(item.content as string)
          const wl = unplanned.find(w => w.loadId === payload.id)
          if (!wl) { cb(null); return }
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
            setEpics(prevEpics => {
              return prevEpics.map(epic => {
                if (!updatedWorkLoad || !updatedWorkLoad.epicIds?.includes(epic.epicId)) return epic
                return {
                  ...epic,
                  workLoads: (epic.workLoads || []).map(load => {
                    if (load.loadId !== updatedWorkLoad.loadId) return load
                    return updatedWorkLoad
                  })
                }
              })
            })
            setUnplanned(prev => prev.filter(x => x.loadId !== wl.loadId))
            console.log(`Workload time updated successfully for loadId: ${wl.loadId}`)
          }
        } catch { cb(null) }
      }
    }

    const tl = new Timeline(timelineRef.current, items, groups, options)
    timelineInstance.current = tl

    tl.on('move', async ({ item, start, end, group }) => {
      const d = items.get(item as string)
      if (!d) return
      const newStart = startOfDay(start)
      const duration = end ? Math.max(1, differenceInCalendarDays(end, start)) : 1
      const newEnd = addDays(newStart, duration)

      try {
        const updatedWorkLoad = await updateWorkLoadTime(
          group || d.group,
          d.id as string,
          newStart.toISOString(),
          newEnd.toISOString()
        )

        if (updatedWorkLoad) {
          items.update({ id: d.id, start: newStart, end: newEnd })
          setEpics(prevEpics => {
            return prevEpics.map(epic => {
              if (!updatedWorkLoad || !updatedWorkLoad.epicIds?.includes(epic.epicId)) return epic
              return {
                ...epic,
                workLoads: (epic.workLoads || []).map(load => {
                  if (load.loadId !== updatedWorkLoad.loadId) return load
                  return updatedWorkLoad
                })
              }
            })
          })
          console.log(`Workload time updated successfully for loadId: ${d.id}`)
        }
      } catch (err) {
        console.error('更新工作負載時間失敗:', err)
      }
    })

    const handleResize = () => timelineInstance.current?.redraw()
    window.addEventListener('resize', handleResize)

    return () => {
      tl.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [epics, unplanned])

  useEffect(() => {
    const ref = timelineRef.current
    if (!ref || !timelineInstance.current || !itemsDataSet.current) return
    const handleDragOver = (e: DragEvent) => e.preventDefault()
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      try {
        const payload: DraggableItem = JSON.parse(e.dataTransfer?.getData('text') || '{}')
        const point = timelineInstance.current!.getEventProperties(e)
        if (!point.time) return
        const wl = unplanned.find(w => w.loadId === payload.id)
        if (!wl) return
        const groupId = payload.group || epics[0].epicId
        const startTime = startOfDay(point.time)
        const endTime = addDays(startTime, 1)
        updateWorkLoadTime(groupId, wl.loadId, startTime.toISOString(), endTime.toISOString()).then((updatedWorkLoad) => {
          if (updatedWorkLoad) {
            itemsDataSet.current?.add({
              id: wl.loadId,
              group: groupId,
              content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
              start: startTime,
              end: endTime,
              type: 'range'
            })
            setEpics(prevEpics => {
              return prevEpics.map(epic => {
                if (!updatedWorkLoad || !updatedWorkLoad.epicIds?.includes(epic.epicId)) return epic
                return {
                  ...epic,
                  workLoads: (epic.workLoads || []).map(load => {
                    if (load.loadId !== updatedWorkLoad.loadId) return load
                    return updatedWorkLoad
                  })
                }
              })
            })
            setUnplanned(prev => prev.filter(x => x.loadId !== wl.loadId))
            console.log(`Workload time updated successfully for loadId: ${wl.loadId}`)
          }
        })
      } catch { }
    }
    ref.addEventListener('dragover', handleDragOver)
    ref.addEventListener('drop', handleDrop)
    return () => {
      ref.removeEventListener('dragover', handleDragOver)
      ref.removeEventListener('drop', handleDrop)
    }
  }, [unplanned, epics])

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => {
    const dragItem: DraggableItem = {
      id: wl.loadId,
      type: 'range',
      content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
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
