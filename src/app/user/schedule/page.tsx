'use client'

import type { WorkEpicEntity } from '@/app/actions/workepic.action'
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client'
import { UserBottomNav } from '@/modules/shared/interfaces/navigation/user-bottom-nav'
import { addDays, subDays } from 'date-fns'
import { collection, CollectionReference, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import * as React from "react"
import { useEffect, useRef, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

interface WorkLoadEntity {
  loadId: string
  title: string
  executor: string[]
  plannedStartTime: string
  plannedEndTime: string
}

interface LooseWorkLoad extends WorkLoadEntity {
  epicId: string
  epicTitle: string
}

/**
 * 解析 Epic 資料快照，取得 Epic 列表與未排班工作
 */
function parseEpicSnapshot(
  docs: QueryDocumentSnapshot<WorkEpicEntity, DocumentData>[]
): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } {
  const epics = docs.map(doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity))
  const unplanned = epics.flatMap(e =>
    (e.workLoads ?? [])
      .filter(l => !l.plannedStartTime)
      .map(l => ({
        ...l,
        epicId: e.epicId,
        epicTitle: e.title,
      }))
  )
  return { epics, unplanned }
}

const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>): string =>
  `<div><div>${wl.title || "（無標題）"}</div><div class="text-gray-400">${Array.isArray(wl.executor) ? wl.executor.join(", ") : "（無執行者）"}</div></div>`

const WorkSchedulePage = (): React.ReactElement => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstance = useRef<Timeline | null>(null)
  const [epicSnapshot] = useCollection(
    collection(firestore, 'workEpic') as CollectionReference<WorkEpicEntity>
  )

  useEffect(() => {
    if (!epicSnapshot) {
      return
    }
    const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs as QueryDocumentSnapshot<WorkEpicEntity, DocumentData>[])
    setEpics(epics)
    setUnplanned(unplanned)
  }, [epicSnapshot])

  useEffect(() => {
    if (!timelineRef.current || epics.length === 0) {
      return
    }

    if (timelineInstance.current) {
      timelineInstance.current.destroy()
      timelineInstance.current = null
    }
    const groups = new DataSet(
      epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` }))
    )
    const items = new DataSet(
      epics.flatMap(e =>
        (e.workLoads ?? [])
          .filter(l => l.plannedStartTime)
          .map(l => ({
            id: l.loadId,
            group: e.epicId,
            type: 'range',
            content: getWorkloadContent(l),
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
          current: "當前",
          year: "年",
          month: "月",
          week: "週",
          day: "日",
          hour: "時",
          minute: "分",
          second: "秒",
          millisecond: "毫秒",
          months: [
            "一月", "二月", "三月", "四月", "五月", "六月",
            "七月", "八月", "九月", "十月", "十一月", "十二月"
          ],
          monthsShort: [
            "1月", "2月", "3月", "4月", "5月", "6月",
            "7月", "8月", "9月", "10月", "11月", "12月"
          ],
          days: [
            "星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"
          ],
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
    <div className="relative min-h-screen w-screen max-w-none bg-gradient-to-b from-blue-100 via-white to-blue-50 dark:from-gray-950 dark:via-gray-800 dark:to-gray-950 flex flex-col overflow-hidden">
      {/* 固定在上方的 timeline，滿屏 */}
      <div
        ref={timelineRef}
        className="fixed top-0 left-0 w-screen h-[65vh] bg-white dark:bg-gray-950 border-b z-20 rounded-b-2xl shadow"
        style={{ minWidth: '100vw' }}
      />
      {/* 固定在下方的未排班工作，滿屏 */}
      <div className="fixed left-0 right-0 bottom-0 bg-blue-50/90 dark:bg-gray-900/90 rounded-t-2xl shadow border-t z-30 w-screen max-w-none">
        <div className="p-4">
          <h2 className="text-lg font-bold text-center text-blue-800 dark:text-blue-300 mb-2">
            未排班工作
          </h2>
          {unplanned.length === 0 ? (
            <div className="flex justify-center items-center h-12 text-gray-400 dark:text-gray-500">
              （無未排班工作）
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-8">
              {unplanned.map(wl => (
                <div key={wl.loadId} className="bg-white dark:bg-gray-950 border rounded-xl px-3 py-2 flex flex-col min-w-[180px]">
                  <div className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                    {wl.title || "（無標題）"}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {wl.executor.length > 0 ? wl.executor.join(", ") : "（無執行者）"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* 固定底部導航 */}
      <div className="fixed left-0 right-0 bottom-0 z-40 w-screen max-w-none pointer-events-none">
        <UserBottomNav />
      </div>
      {/* 佔位空間，避免內容被固定區塊遮蓋 */}
      <div className="h-[65vh]" />
      <div className="h-[220px]" />
    </div>
  )
}

export default WorkSchedulePage