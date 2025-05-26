'use client'

import type { WorkEpicEntity } from '@/app/actions/workepic.action'
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client'
import { UserBottomNav } from '@/modules/shared/interfaces/navigation/user-bottom-nav'
import { addDays, subDays } from 'date-fns'
import type { CollectionReference, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { collection } from 'firebase/firestore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import { DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

/**
 * 工作負載資料型別
 */
interface WorkLoadEntity {
  loadId: string
  title: string
  executor: string[]
  plannedStartTime: string
  plannedEndTime: string
}

/**
 * 未排班工作型別
 */
interface LooseWorkLoad extends WorkLoadEntity {
  epicId: string
  epicTitle: string
}

// Timeline 項目型別
interface TimelineItem {
  id: string
  group: string
  type: string
  content: string
  start: Date
  end: Date
}

// Timeline 群組型別
interface TimelineGroup {
  id: string
  content: string
}

/**
 * 解析 Epic 資料
 */
const parseEpicSnapshot = (docs: QueryDocumentSnapshot<WorkEpicEntity, DocumentData>[]): {
  epics: WorkEpicEntity[]
  unplanned: LooseWorkLoad[]
} => {
  const epics = docs.map(doc => ({ ...doc.data(), epicId: doc.id }))
  const unplanned = epics.flatMap(e =>
    (e.workLoads ?? [])
      .filter(l => !l.plannedStartTime)
      .map(l => ({
        ...l,
        epicId: e.epicId,
        epicTitle: e.title
      }))
  )
  return { epics, unplanned }
}

/**
 * 產生顯示內容
 */
const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>): string =>
  `<div><div>${wl.title || "（無標題）"}</div><div class="text-gray-400">${wl.executor?.length ? wl.executor.join(", ") : "（無執行者）"}</div></div>`

/**
 * 比較兩個陣列或物件是否相等
 */
const isEqual = (a: unknown, b: unknown): boolean => {
  // 處理基本類型
  if (a === b) return true;

  // 若一個為空但另一個不為空，則不相等
  if (!a || !b) return false;

  // 處理陣列
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  // 處理物件
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => isEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    ));
  }

  return false;
};

/**
 * 使用者行事曆頁面
 */
const WorkSchedulePage = () => {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([])
  const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInstance = useRef<Timeline | null>(null)

  // 參考儲存上一次的資料，用於比較
  const prevEpicsRef = useRef<WorkEpicEntity[]>([])
  // 儲存 DataSet 實例的參考
  const itemsDataset = useRef<DataSet<TimelineItem> | null>(null)
  const groupsDataset = useRef<DataSet<TimelineGroup> | null>(null)

  const [epicSnapshot] = useCollection(
    collection(firestore, 'workEpic') as CollectionReference<WorkEpicEntity>
  )

  // 處理 Firebase 資料更新
  useEffect(() => {
    if (epicSnapshot) {
      const { epics: newEpics, unplanned: newUnplanned } = parseEpicSnapshot(
        epicSnapshot.docs as QueryDocumentSnapshot<WorkEpicEntity, DocumentData>[]
      )
      setEpics(newEpics)
      setUnplanned(newUnplanned)
    }
  }, [epicSnapshot])

  // 為 Timeline 準備記憶化的資料
  const timelineGroups = useMemo(() =>
    epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` })),
    [epics]
  )

  const timelineItems = useMemo(() =>
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
    ),
    [epics]
  )

  // Timeline 初始化或更新
  useEffect(() => {
    if (!timelineRef.current || epics.length === 0) {
      return
    }

    // 檢查是否需要更新 Timeline
    const hasDifferentData = !isEqual(prevEpicsRef.current, epics);
    prevEpicsRef.current = JSON.parse(JSON.stringify(epics)); // 深複製以進行比較

    // 如果資料沒有變更且 Timeline 已存在，則不需重新建立
    if (!hasDifferentData && timelineInstance.current) {
      return;
    }

    // 更新現有 DataSet 而非重建 Timeline
    if (timelineInstance.current && itemsDataset.current && groupsDataset.current) {
      groupsDataset.current.clear();
      groupsDataset.current.add(timelineGroups);

      itemsDataset.current.clear();
      itemsDataset.current.add(timelineItems);

      return;
    }

    // 首次建立或需要完全重建的情況
    timelineInstance.current?.destroy();

    // 建立新的 DataSet 實例
    const groups = new DataSet<TimelineGroup>(timelineGroups);
    const items = new DataSet<TimelineItem>(timelineItems);

    // 儲存 DataSet 參考以便之後更新
    groupsDataset.current = groups;
    itemsDataset.current = items;

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
      itemsDataset.current = null
      groupsDataset.current = null
    }
  }, [epics, timelineGroups, timelineItems])

  return (
    <div className="min-h-screen w-screen max-w-none bg-gradient-to-b from-blue-100 via-white to-blue-50 dark:from-gray-950 dark:via-gray-800 dark:to-gray-950 flex flex-col overflow-hidden" style={{ position: 'relative' }}>
      {/* 將時間軸設為 position: fixed，確保滿寬且不受父層影響 */}
      <div
        ref={timelineRef}
        className="bg-white dark:bg-gray-950 border rounded-md shadow timeline-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          margin: 'auto',
          width: '100%',
          minWidth: '100%',
          height: '65vh',
          zIndex: 20
        }}
      />
      {/* 保留原本的底部區塊，避免被 timeline 蓋住 */}
      <div className="fixed left-0 right-0 bottom-0 bg-blue-50/90 dark:bg-gray-900/90 rounded-t-2xl shadow border-t z-30 w-screen max-w-none">
        <div className="p-4">
          <h2 className="text-lg font-bold text-center text-blue-800 dark:text-blue-300 mb-2">未排班工作</h2>
          {unplanned.length === 0 ? (
            <div className="flex justify-center items-center h-12 text-gray-400 dark:text-gray-500">（無未排班工作）</div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-8">
              {unplanned.map(wl => (
                <div key={wl.loadId} className="bg-white dark:bg-gray-950 border rounded-xl px-3 py-2 flex flex-col min-w-[180px]">
                  <div className="font-medium text-gray-700 dark:text-gray-200 text-sm">{wl.title || "（無標題）"}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">{wl.executor.length ? wl.executor.join(", ") : "（無執行者）"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="fixed left-0 right-0 bottom-0 z-40 w-screen max-w-none">
        <UserBottomNav />
      </div>
    </div>
  )
}

export default WorkSchedulePage