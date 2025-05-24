'use client'

import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { collection, doc, DocumentData, QueryDocumentSnapshot, runTransaction } from 'firebase/firestore'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { DataGroup, DataItem, DataSet, Timeline, TimelineItem, TimelineOptions } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

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
      .filter(l => !l.plannedStartTime || l.plannedStartTime === '')
      .map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
  )
  return { epics, unplanned }
}

const useUpdateWorkLoadTime = () =>
  useCallback(async (
    newEpicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
    oldEpicId?: string
  ): Promise<WorkLoadEntity | null> => {
    if (!newEpicId || !loadId || !plannedStartTime) throw new Error('缺少必要參數')
    
    const newEpicRef = doc(firestore, 'workEpic', newEpicId)
    const oldEpicRef = oldEpicId && oldEpicId !== newEpicId ? doc(firestore, 'workEpic', oldEpicId) : null

    let updatedWorkLoad: WorkLoadEntity | null = null

    await runTransaction(firestore, async transaction => {
      // 從原Epic刪除（只有當移動到不同Epic時）
      if (oldEpicRef && oldEpicId !== newEpicId) {
        const oldEpicDoc = await transaction.get(oldEpicRef)
        if (!oldEpicDoc.exists()) throw new Error('原Epic不存在')
        const oldEpicData = oldEpicDoc.data()
        const oldWorkLoads = [...(oldEpicData.workLoads || [])]
        const oldIndex = oldWorkLoads.findIndex((wl: WorkLoadEntity) => wl.loadId === loadId)
        if (oldIndex === -1) throw new Error('未找到原工作負載')
        
        const [movedWorkLoad] = oldWorkLoads.splice(oldIndex, 1)
        updatedWorkLoad = { 
          ...movedWorkLoad, 
          plannedStartTime, 
          plannedEndTime: plannedEndTime || '',
          epicIds: [newEpicId] // 更新Epic關聯
        }
        transaction.update(oldEpicRef, { workLoads: oldWorkLoads })
      }

      // 添加到新Epic或更新現有工作負載
      const newEpicDoc = await transaction.get(newEpicRef)
      if (!newEpicDoc.exists()) throw new Error('目標Epic不存在')
      const newEpicData = newEpicDoc.data()
      const newWorkLoads = [...(newEpicData.workLoads || [])]
      
      const newIndex = newWorkLoads.findIndex((wl: WorkLoadEntity) => wl.loadId === loadId)
      
      if (newIndex === -1) {
        // 新增工作負載（來自未排班或其他Epic）
        const workLoadToAdd = updatedWorkLoad || {
          loadId,
          plannedStartTime,
          plannedEndTime: plannedEndTime || '',
          taskId: '',
          plannedQuantity: 0,
          unit: '',
          actualQuantity: 0,
          executor: [],
          title: '',
          epicIds: [newEpicId]
        } as WorkLoadEntity
        newWorkLoads.push(workLoadToAdd)
        updatedWorkLoad = workLoadToAdd
      } else {
        // 更新現有工作負載（同一Epic內的時間調整）
        const existingWorkLoad = newWorkLoads[newIndex]
        updatedWorkLoad = { 
          ...existingWorkLoad, 
          plannedStartTime, 
          plannedEndTime: plannedEndTime || existingWorkLoad.plannedEndTime || '',
          epicIds: [newEpicId]
        }
        newWorkLoads[newIndex] = updatedWorkLoad
      }
      
      transaction.update(newEpicRef, { workLoads: newWorkLoads })
    })

    return updatedWorkLoad
  }, [])

const ClientWorkSchedulePage = () => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstance = useRef<Timeline | null>(null)
  const itemsDataSet = useRef<DataSet<DataItem> | null>(null)
  const [epicSnapshot, epicLoading, epicError] = useCollection(collection(firestore, 'workEpic'))
  const updateWorkLoadTime = useUpdateWorkLoadTime()

  useEffect(() => {
    if (!epicSnapshot) return
    const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
    setEpics(epics)
    setUnplanned(unplanned)
  }, [epicSnapshot])

  const patchWorkLoadLocal = (updatedWorkLoad: WorkLoadEntity, oldEpicId?: string) => {
    const targetEpicId = updatedWorkLoad.epicIds[0]
    
    setEpics(prevEpics => {
      let newEpics = [...prevEpics]
      
      // 從原Epic刪除（如果是跨Epic移動）
      if (oldEpicId && oldEpicId !== targetEpicId) {
        newEpics = newEpics.map(epic => 
          epic.epicId === oldEpicId
            ? { 
                ...epic, 
                workLoads: epic.workLoads?.filter(wl => wl.loadId !== updatedWorkLoad.loadId) || [] 
              }
            : epic
        )
      }

      // 添加或更新到目標Epic
      return newEpics.map(epic => {
        if (epic.epicId !== targetEpicId) return epic
        
        const workLoads = epic.workLoads || []
        const existingIndex = workLoads.findIndex(wl => wl.loadId === updatedWorkLoad.loadId)
        
        if (existingIndex === -1) {
          // 新增
          return { 
            ...epic, 
            workLoads: [...workLoads, updatedWorkLoad]
          }
        } else {
          // 更新
          const newWorkLoads = [...workLoads]
          newWorkLoads[existingIndex] = updatedWorkLoad
          return { 
            ...epic, 
            workLoads: newWorkLoads
          }
        }
      })
    })
    
    // 從未排班清單中移除
    setUnplanned(prev => prev.filter(x => x.loadId !== updatedWorkLoad.loadId))
  }

  useEffect(() => {
    if (!timelineRef.current || !epics.length) return
    
    const groups = new DataSet<DataGroup>(epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` })))
    const items = new DataSet<DataItem>(
      epics.flatMap(e =>
        (e.workLoads || [])
          .filter(l => l.plannedStartTime && l.plannedStartTime !== '')
          .map(l => ({
            id: l.loadId,
            group: e.epicId,
            type: 'range',
            content: getWorkloadContent(l),
            start: new Date(l.plannedStartTime),
            end: l.plannedEndTime && l.plannedEndTime !== '' 
              ? new Date(l.plannedEndTime) 
              : addDays(new Date(l.plannedStartTime), 1)
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
          const targetGroup = item.group || epics[0].epicId
          
          const obj: TimelineItem = {
            id: wl.loadId,
            group: targetGroup,
            content: getWorkloadContent(wl),
            start, 
            end, 
            type: 'range'
          }
          cb(obj)
          
          const updatedWorkLoad = await updateWorkLoadTime(
            String(targetGroup), 
            String(wl.loadId), 
            start.toISOString(), 
            end.toISOString(),
            wl.epicId
          )
          if (updatedWorkLoad) patchWorkLoadLocal(updatedWorkLoad, wl.epicId)
        } catch (error) { 
          console.error('新增工作負載失敗:', error)
          cb(null) 
        }
      }
    }

    const tl = new Timeline(timelineRef.current, items, groups, options)
    timelineInstance.current = tl

    tl.on('changed', async (properties) => {
      // 處理批量變更
      if (properties.items && properties.items.length > 0) {
        const itemId = properties.items[0] as string
        const updatedItem = items.get(itemId)
        if (!updatedItem) return

        const newStart = startOfDay(new Date(updatedItem.start as Date))
        const rawEnd = updatedItem.end as Date
        const duration = rawEnd ? Math.max(1, differenceInCalendarDays(rawEnd, newStart)) : 1
        const newEnd = addDays(newStart, duration)
        
        // 找到原本的Epic
        const originalEpic = epics.find(epic => 
          epic.workLoads?.some(wl => wl.loadId === itemId)
        )
        const originalEpicId = originalEpic?.epicId
        
        try {
          const updatedWorkLoad = await updateWorkLoadTime(
            updatedItem.group as string,  // 新EpicID
            itemId,
            newStart.toISOString(),
            newEnd.toISOString(),
            originalEpicId  // 原EpicID
          )

          if (updatedWorkLoad) {
            // 更新Timeline項目
            items.update({ 
              id: itemId, 
              start: newStart, 
              end: newEnd,
              group: updatedItem.group
            })
            // 更新本地狀態
            patchWorkLoadLocal(updatedWorkLoad, originalEpicId)
          }
        } catch (err) {
          console.error('更新失敗:', err)
          // 回滾到原始狀態
          const originalItem = items.get(itemId)
          if (originalItem) {
            items.update({ 
              id: itemId, 
              start: originalItem.start, 
              end: originalItem.end, 
              group: originalEpicId 
            })
          }
        }
      }
    })

    const handleResize = () => timelineInstance.current?.redraw()
    window.addEventListener('resize', handleResize)

    return () => {
      tl.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [epics, unplanned, updateWorkLoadTime])

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
        
        updateWorkLoadTime(groupId, wl.loadId, startTime.toISOString(), endTime.toISOString(), wl.epicId)
          .then(updatedWorkLoad => {
            if (updatedWorkLoad) {
              itemsDataSet.current?.add({
                id: wl.loadId,
                group: groupId,
                content: getWorkloadContent(wl),
                start: startTime,
                end: endTime,
                type: 'range'
              })
              patchWorkLoadLocal(updatedWorkLoad, wl.epicId)
            }
          })
          .catch(error => {
            console.error('拖放更新失敗:', error)
          })
      } catch (error) {
        console.error('拖放處理失敗:', error)
      }
    }
    
    ref.addEventListener('dragover', handleDragOver)
    ref.addEventListener('drop', handleDrop)
    
    return () => {
      ref.removeEventListener('dragover', handleDragOver)
      ref.removeEventListener('drop', handleDrop)
    }
  }, [unplanned, epics, updateWorkLoadTime])

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