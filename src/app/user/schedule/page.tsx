'use client'

import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client'
import { UserBottomNav } from '@/modules/shared/interfaces/navigation/user-bottom-nav'
import '@/styles/vis-timeline.css'
import { addDays, subDays } from 'date-fns'
import { collection, CollectionReference, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { DataSet, Timeline } from 'vis-timeline/standalone'

interface WorkLoadEntity {
  loadId: string
  title: string
  executor: string[]
  plannedStartTime: string
  plannedEndTime: string
}

interface WorkEpicEntity {
  epicId: string
  title: string
  workLoads?: WorkLoadEntity[]
}

const WorkSchedulePage = (): React.ReactElement => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstance = useRef<Timeline | null>(null)
  const [epicSnapshot] = useCollection(collection(firestore, 'workEpic') as CollectionReference<DocumentData>)

  useEffect(() => {
    if (!epicSnapshot) return
    const docs = epicSnapshot.docs as QueryDocumentSnapshot<DocumentData>[]
    const epicsData = docs.map(doc => ({ ...(doc.data() as Omit<WorkEpicEntity, 'epicId'>), epicId: doc.id }))
    setEpics(epicsData)
  }, [epicSnapshot])

  useEffect(() => {
    if (!timelineRef.current || epics.length === 0) return
    if (timelineInstance.current) {
      timelineInstance.current.destroy()
      timelineInstance.current = null
    }
    const groups = new DataSet(epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` })))
    const items = new DataSet(
      epics.flatMap(e =>
        (e.workLoads ?? [])
          .filter(l => l.plannedStartTime)
          .map(l => ({
            id: l.loadId,
            group: e.epicId,
            type: 'range',
            content: `<div><div>${l.title || "（無標題）"}</div><div class="text-gray-400">${Array.isArray(l.executor) ? l.executor.join(", ") : "（無執行者）"}</div></div>`,
            start: new Date(l.plannedStartTime),
            end: l.plannedEndTime ? new Date(l.plannedEndTime) : addDays(new Date(l.plannedStartTime), 1)
          }))
      )
    )
    const now = new Date()
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = subDays(today0, 3)
    const end = addDays(today0, 4)
    end.setHours(23, 59, 59, 999)
    const timeline = new Timeline(timelineRef.current, items, groups, {
      stack: true,
      orientation: 'top',
      editable: false,
      locale: 'zh-tw',
      locales: {
        'zh-tw': {
          current: "當前", year: "年", month: "月", week: "週", day: "日", hour: "時", minute: "分", second: "秒", millisecond: "毫秒",
          months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
          monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
          days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
          daysShort: ["日", "一", "二", "三", "四", "五", "六"]
        }
      },
      zoomMin: 7 * 24 * 60 * 60 * 1000,
      zoomMax: 30 * 24 * 60 * 60 * 1000,
      timeAxis: { scale: 'day', step: 1 }
    })
    timeline.setWindow(start, end, { animation: false })
    timelineInstance.current = timeline
    return () => {
      timeline.destroy()
      timelineInstance.current = null
    }
  }, [epics])

  return (
    <div className="min-h-screen w-screen max-w-none bg-gradient-to-b from-blue-100 via-white to-blue-50 dark:from-gray-950 dark:via-gray-800 dark:to-gray-950 flex flex-col overflow-hidden">
      <div className="flex flex-1 min-h-screen items-center justify-center pb-16">
        <div
          ref={timelineRef}
          className="bg-white dark:bg-gray-950 border rounded-md shadow mx-auto my-auto"
          style={{ width: '95vw', height: '85vh' }}
        />
      </div>
      <div className="fixed left-0 right-0 bottom-0 z-40 w-screen max-w-none">
        <UserBottomNav />
      </div>
    </div>
  )
}

export default WorkSchedulePage