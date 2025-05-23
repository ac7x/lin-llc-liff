'use client'

import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays, subDays } from 'date-fns'
import { collection, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
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

interface WorkEpicEntity {
  epicId: string
  title: string
  workLoads?: WorkLoadEntity[]
}

type LooseWorkLoad = WorkLoadEntity & { epicId: string; epicTitle: string }

function parseEpicSnapshot(
  docs: QueryDocumentSnapshot<DocumentData, DocumentData>[]
): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } {
  const epics: WorkEpicEntity[] = docs.map(doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity))
  const unplanned: LooseWorkLoad[] = epics.flatMap(e =>
    (e.workLoads || [])
      .filter(l => !l.plannedStartTime || l.plannedStartTime === '')
      .map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
  )
  return { epics, unplanned }
}

const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>) =>
  `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`

const ClientWorkSchedulePage = () => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const [epicSnapshot] = useCollection(collection(firestore, 'workEpic'))

  useEffect(() => {
    if (!epicSnapshot) return
    const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
    setEpics(epics)
    setUnplanned(unplanned)
  }, [epicSnapshot])

  useEffect(() => {
    if (!timelineRef.current || !epics.length) return
    const groups = new DataSet(epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` })))
    const items = new DataSet(
      epics.flatMap(e =>
        (e.workLoads || [])
          .filter(l => l.plannedStartTime && l.plannedStartTime !== '')
          .map(l => ({
            id: l.loadId,
            group: e.epicId,
            type: 'range',
            content: getWorkloadContent(l),
            start: new Date(l.plannedStartTime),
            end:
              l.plannedEndTime && l.plannedEndTime !== ''
                ? new Date(l.plannedEndTime)
                : addDays(new Date(l.plannedStartTime), 1),
          }))
      )
    )

    const now = new Date()
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = subDays(today0, 3)
    const end = addDays(today0, 4)
    end.setHours(23, 59, 59, 999)

    const tl = new Timeline(timelineRef.current, items, groups, {
      stack: true,
      orientation: 'top',
      editable: false,
      locale: 'zh-tw',
      locales: {
        'zh-tw': {
          current: '當前',
          year: '年',
          month: '月',
          week: '週',
          day: '日',
          hour: '時',
          minute: '分',
          second: '秒',
          millisecond: '毫秒',
          months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
          monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
          days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
          daysShort: ['日', '一', '二', '三', '四', '五', '六'],
        },
      },
      zoomMin: 7 * 24 * 60 * 60 * 1000,
      zoomMax: 30 * 24 * 60 * 60 * 1000,
      timeAxis: { scale: 'day', step: 1 },
      format: {
        minorLabels: {
          minute: '',
          hour: '',
          day: 'D',
          month: 'MMM',
          year: 'YYYY',
        },
        majorLabels: {
          day: 'YYYY/MM/DD',
          month: 'YYYY/MM',
          year: 'YYYY',
        },
      },
    })
    tl.setWindow(start, end, { animation: false })

    return () => {
      tl.destroy()
    }
  }, [epics])

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-100 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors duration-300">
      <div className="flex-none h-[70vh] w-full flex items-center justify-center">
        <div
          className="w-full h-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden transition-colors duration-300"
          ref={timelineRef}
          style={{ minWidth: '100vw', height: '100%' }}
        />
      </div>
      <div className="flex-none min-h-[25vh] w-full bg-blue-50/80 dark:bg-gray-800/80 rounded-t-3xl shadow-inner transition-colors duration-300">
        <div className="w-full h-full flex flex-col p-4 max-w-[100vw] mx-auto">
          <h2 className="text-lg font-bold text-center text-blue-800 dark:text-blue-300 mb-4 tracking-wide transition-colors duration-300">
            未排班工作
          </h2>
          <div className="flex flex-wrap gap-3 overflow-y-auto pb-16 px-0.5">
            {unplanned.length === 0 ? (
              <div className="text-gray-400 dark:text-gray-500 text-center w-full transition-colors duration-300">（無未排班工作）</div>
            ) : (
              unplanned.map(wl => (
                <div
                  key={wl.loadId}
                  className="
                    bg-white/90 dark:bg-gray-900/90 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2.5
                    hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors duration-300 hover:shadow-md
                    flex flex-col justify-between gap-2
                    flex-auto min-w-[180px] max-w-full
                  "
                  title={`來自 ${wl.epicTitle}`}
                >
                  <div className="font-medium text-gray-700 dark:text-gray-300 text-sm line-clamp-2 transition-colors duration-300">
                    {wl.title || '(無標題)'}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 transition-colors duration-300">
                    {Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ClientBottomNav />
    </div>
  )
}

export default ClientWorkSchedulePage