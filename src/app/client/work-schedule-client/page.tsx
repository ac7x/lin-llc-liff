'use client'

import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, startOfDay } from 'date-fns'
import { collection, doc, runTransaction } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { DataGroup, DataItem, DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone'
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

const renderContent = (title?: string, executor?: string[] | string) =>
  `<div><div>${title || '(無標題)'}</div><div style="color:#888">${Array.isArray(executor) ? executor.join(', ') : executor || '(無執行者)'}</div></div>`

const ClientWorkSchedulePage = () => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstance = useRef<Timeline | null>(null)
  const itemsDataSet = useRef<DataSet<DataItem> | null>(null)

  const [epicSnapshot, epicLoading, epicError] = useCollection(
    collection(firestore, 'workEpic')
  )

  // 只在 Firestore 資料變動時處理狀態
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

  // 拖曳 drop 時才寫入 Firestore
  const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string
  ): Promise<WorkLoadEntity | null> => {
    const epicRef = doc(firestore, 'workEpic', epicId)
    let updatedWorkLoad: WorkLoadEntity | null = null
    await runTransaction(firestore, async (transaction) => {
      const epicDoc = await transaction.get(epicRef)
      if (!epicDoc.exists()) return
      const epicData = epicDoc.data() as WorkEpicEntity
      if (!epicData.workLoads) return
      const index = epicData.workLoads.findIndex(wl => wl.loadId === loadId)
      if (index !== -1) {
        epicData.workLoads[index] = {
          ...epicData.workLoads[index],
          plannedStartTime,
          plannedEndTime
        }
        updatedWorkLoad = epicData.workLoads[index]
        transaction.update(epicRef, { workLoads: epicData.workLoads })
      }
    })
    return updatedWorkLoad
  }

  // 初始化 timeline，只處理渲染與拖曳互動
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
            content: renderContent(l.title, l.executor),
            start: new Date(l.plannedStartTime),
            end: l.plannedEndTime ? new Date(l.plannedEndTime) : undefined
          }))
      )
    )
    itemsDataSet.current = items

    const options: TimelineOptions = {
      stack: true,
      orientation: 'top',
      editable: false, // 禁止內部直接新增/移動，只允許外部拖曳
      locale: 'zh-tw',
      tooltip: { followMouse: true },
      zoomMin: 86400000,
      zoomMax: 90 * 86400000
    }

    const tl = new Timeline(timelineRef.current, items, groups, options)
    timelineInstance.current = tl

    const handleResize = () => timelineInstance.current?.redraw()
    window.addEventListener('resize', handleResize)
    return () => {
      tl.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [epics])

  // 只處理 drop 寫入
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
        // 僅此處寫入資料庫
        updateWorkLoadTime(groupId, wl.loadId, startTime.toISOString(), endTime.toISOString())
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
    const dragItem: DraggableItem = {
      id: wl.loadId,
      type: 'range',
      content: renderContent(wl.title, wl.executor),
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