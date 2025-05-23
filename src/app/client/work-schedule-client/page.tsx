'use client'

import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { collection, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { DataGroup, DataItem, DataSet, Timeline, TimelineItem, TimelineOptions } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { updateWorkLoadTime as updateWorkLoadTimeRepo } from './infrastructure/repository/workScheduleRepository'
import useTimelineEventHandlers from './interfaces/hooks/useTimelineEventHandlers'

interface WorkLoadEntity {
  loadId: string
  taskId: string
  plannedQuantity: number
  unit: string
  plannedStartTime: string
  plannedEndTime: string
  actualQuantity: number
  executor: string[]
  title: string
  notes?: string
  epicIds: string[]
}

interface WorkEpicEntity {
  epicId: string
  title: string
  startDate: string
  endDate: string
  insuranceStatus?: '無' | '有'
  insuranceDate?: string
  owner: { memberId: string, name: string }
  siteSupervisors?: { memberId: string, name: string }[]
  safetyOfficers?: { memberId: string, name: string }[]
  status: '待開始' | '進行中' | '已完成' | '已取消'
  priority: number
  region: '北部' | '中部' | '南部' | '東部' | '離島'
  address: string
  createdAt: string
  workZones?: unknown[]
  workTypes?: unknown[]
  workFlows?: unknown[]
  workTasks?: unknown[]
  workLoads?: WorkLoadEntity[]
}

type LooseWorkLoad = WorkLoadEntity & { epicId: string, epicTitle: string }

interface DraggableItem {
  id: string
  type: 'range'
  content: string
  group: string
  start: Date
  end: Date
}

const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>) =>
  `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`

function parseEpicSnapshot(
  docs: QueryDocumentSnapshot<DocumentData, DocumentData>[]
): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } {
  const epics: WorkEpicEntity[] = docs.map(
    doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity)
  )
  const unplanned: LooseWorkLoad[] = epics.flatMap(e =>
    (e.workLoads || [])
      .filter(l => !l.plannedStartTime)
      .map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
  )
  return { epics, unplanned }
}

const updateWorkLoadTime = updateWorkLoadTimeRepo

const ClientWorkSchedulePage = () => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstance = useRef<Timeline | null>(null)
  const itemsDataSet = useRef<DataSet<DataItem> | null>(null)
  const [epicSnapshot, epicLoading, epicError] = useCollection(collection(firestore, 'workEpic'))

  useEffect(() => {
    if (!epicSnapshot) return
    const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
    setEpics(epics)
    setUnplanned(unplanned)
  }, [epicSnapshot])

  const patchWorkLoadLocal = (updatedWorkLoad: WorkLoadEntity) => {
    setEpics(prevEpics =>
      prevEpics.map(epic =>
        epic.epicId !== updatedWorkLoad.epicIds[0] ? epic : {
          ...epic,
          workLoads: (epic.workLoads || []).map(load =>
            load.loadId !== updatedWorkLoad.loadId ? load : updatedWorkLoad
          )
        }
      )
    )
    setUnplanned(prev => prev.filter(x => x.loadId !== updatedWorkLoad.loadId))
  }

  useEffect(() => {
    if (!timelineRef.current || !epics.length) return
    const groups = new DataSet<DataGroup>(epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` })))
    const items = new DataSet<DataItem>(
      epics.flatMap(e =>
        (e.workLoads || [])
          .filter(l => l.plannedStartTime)
          .map(l => ({
            id: l.loadId,
            group: e.epicId,
            type: 'range',
            content: getWorkloadContent(l),
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
            content: getWorkloadContent(wl),
            start, end, type: 'range'
          }
          cb(obj)
          const updatedWorkLoad = await updateWorkLoadTime(String(obj.group), String(wl.loadId), start.toISOString(), end.toISOString())
          if (updatedWorkLoad) patchWorkLoadLocal(updatedWorkLoad)
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
          patchWorkLoadLocal(updatedWorkLoad)
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
  }, [epics, unplanned, updateWorkLoadTime])

  // timeline 事件監聽 hook
  useTimelineEventHandlers(
    timelineRef as React.RefObject<HTMLDivElement>,
    timelineInstance.current,
    itemsDataSet.current,
    unplanned,
    epics,
    updateWorkLoadTime,
    patchWorkLoadLocal
  )

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => {
    const dragItem: DraggableItem = {
      id: wl.loadId,
      type: 'range',
      content: getWorkloadContent(wl),
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
        {epicLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white">資料載入中...</div>
          </div>
        )}
        {epicError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white">載入錯誤: {epicError.message}</div>
          </div>
        )}
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

export default ClientWorkSchedulePage