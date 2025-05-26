'use client'

import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav'
import '@/styles/timeline.scss'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
	collection,
	doc,
	DocumentData,
	getFirestore,
	QueryDocumentSnapshot,
	updateDoc,
} from 'firebase/firestore'
import React, { useEffect, useMemo, useState } from 'react'
import Timeline from 'react-calendar-timeline'
import 'react-calendar-timeline/style.css'
import { useCollection } from 'react-firebase-hooks/firestore'

// === date-fns imports ===
import { addDays, differenceInMilliseconds, endOfDay, format, isValid, parseISO, startOfDay, subDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// Firebase config
const firebaseConfig = {
	apiKey: 'AIzaSyDsJP6_bjWLQ0SQiarhe3UIApnqx60vCqg',
	authDomain: 'lin-llc-liff.firebaseapp.com',
	projectId: 'lin-llc-liff',
	storageBucket: 'lin-llc-liff.firbasestorage.app',
	messagingSenderId: '734381604026',
	appId: '1:734381604026:web:a07a50fe85c6c5acd25683',
	measurementId: 'G-KBMLTJL6KK'
}

/**
 * 初始化 Firebase App (singleton pattern)
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const firestore = getFirestore(app)

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

type LooseWorkLoad = WorkLoadEntity & { epicId: string, epicTitle: string }

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

const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>) =>
	`${wl.title || '(無標題)'} | ${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}`

const WorkScheduleManagementPage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
	const [epicSnapshot] = useCollection(collection(firestore, 'workEpic'))

	// 1. 取得 Firestore 的排班資料
	useEffect(() => {
		if (!epicSnapshot) {
			return
		}
		const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
		setEpics(epics)
		setUnplanned(unplanned)
	}, [epicSnapshot])

	// 2. 將 Firestore 資料轉為 Timeline groups/items 格式
	const groupCount = 15
	const groups = useMemo(() => {
		const filledEpics = [...epics]
		while (filledEpics.length < groupCount) {
			filledEpics.push({
				epicId: `empty-${filledEpics.length}`,
				title: ''
			})
		}
		return filledEpics.map(e => ({
			id: e.epicId,
			title: e.title
		}))
	}, [epics])

	const items = useMemo(() =>
		epics.flatMap(e =>
			(e.workLoads || [])
				.filter(l => l.plannedStartTime && l.plannedStartTime !== '')
				.map(l => {
					const start = parseISO(l.plannedStartTime)
					const end = l.plannedEndTime && l.plannedEndTime !== ''
						? parseISO(l.plannedEndTime)
						: addDays(start, 1)
					return {
						id: l.loadId,
						group: e.epicId,
						title: getWorkloadContent(l),
						start_time: start,
						end_time: end,
					}
				})
		)
		, [epics])

	// 3. 操作：移動/改時間/改 group
	const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number) => {
		const item = items.find(i => i.id === itemId)
		if (!item) {
			return
		}
		const oldEpic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!oldEpic) {
			return
		}
		const wlIdx = (oldEpic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) {
			return
		}
		const newGroupId = groups[newGroupOrder].id
		const newEpic = epics.find(e => e.epicId === newGroupId)
		if (!newEpic) {
			return
		}
		const newStart = new Date(dragTime)
		const duration = differenceInMilliseconds(item.end_time, item.start_time)
		const newEnd = new Date(newStart.getTime() + duration)
		if (oldEpic.epicId !== newEpic.epicId) {
			const updatedOldWorkLoads = (oldEpic.workLoads || []).filter(wl => wl.loadId !== itemId)
			await updateDoc(doc(firestore, 'workEpic', oldEpic.epicId), { workLoads: updatedOldWorkLoads })
			const oldWorkload = (oldEpic.workLoads || [])[wlIdx]
			const newWorkLoad: WorkLoadEntity = {
				...oldWorkload,
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
			const updatedNewWorkLoads = [...(newEpic.workLoads || []), newWorkLoad]
			await updateDoc(doc(firestore, 'workEpic', newEpic.epicId), { workLoads: updatedNewWorkLoads })
		} else {
			const newWorkLoads = [...(oldEpic.workLoads || [])]
			newWorkLoads[wlIdx] = {
				...newWorkLoads[wlIdx],
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
			await updateDoc(doc(firestore, 'workEpic', oldEpic.epicId), { workLoads: newWorkLoads })
		}
	}

	// 4. 調整區段長度
	const handleItemResize = async (itemId: string, time: number, edge: 'left' | 'right') => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) {
			return
		}
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) {
			return
		}
		const wl = (epic.workLoads || [])[wlIdx]
		let newStart = parseISO(wl.plannedStartTime)
		let newEnd = wl.plannedEndTime && wl.plannedEndTime !== '' ? parseISO(wl.plannedEndTime) : undefined
		if (edge === 'left') {
			newStart = new Date(time)
		}
		if (edge === 'right') {
			newEnd = new Date(time)
		}
		const newWorkLoads = [...(epic.workLoads || [])]
		newWorkLoads[wlIdx] = {
			...wl,
			plannedStartTime: newStart.toISOString(),
			plannedEndTime: newEnd && isValid(newEnd) ? newEnd.toISOString() : '',
		}
		await updateDoc(doc(firestore, 'workEpic', epic.epicId), { workLoads: newWorkLoads })
	}

	// 5. 刪除（丟回未排班區）
	const handleItemRemove = async (itemId: string) => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) {
			return
		}
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) {
			return
		}
		const newWorkLoads = [...(epic.workLoads || [])]
		const updateWL = { ...newWorkLoads[wlIdx], plannedStartTime: '', plannedEndTime: '' }
		newWorkLoads[wlIdx] = updateWL
		await updateDoc(doc(firestore, 'workEpic', epic.epicId), { workLoads: newWorkLoads })
	}

	// === 設定預設時間區間（date-fns 取代 moment） ===
	const now = new Date()
	const defaultTimeStart = subDays(startOfDay(now), 7)
	const defaultTimeEnd = addDays(endOfDay(now), 14)

	return (
		<div className="min-h-screen w-full bg-black dark:bg-neutral-900 flex flex-col">
			<div className="flex-none h-[20vh]" />
			<div className="flex-none h-[60vh] w-full flex items-center justify-center relative">
				<div className="w-full h-full rounded-2xl bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 shadow overflow-hidden" style={{ minWidth: '100vw', height: 400 }}>
					<Timeline
						groups={groups}
						items={items}
						defaultTimeStart={defaultTimeStart}
						defaultTimeEnd={defaultTimeEnd}
						canMove canResize="both" canChangeGroup stackItems
						onItemMove={handleItemMove}
						onItemResize={(itemId, time, edge) => handleItemResize(itemId as string, time, edge)}
						onItemDoubleClick={handleItemRemove}
						itemRenderer={({ item, getItemProps, getResizeProps }) => {
							const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
							// 顯示日期格式為繁體中文
							const dateStr = `${format(item.start_time, 'yyyy/MM/dd (EEE) HH:mm', { locale: zhTW })} - ${format(item.end_time, 'yyyy/MM/dd (EEE) HH:mm', { locale: zhTW })}`
							return (
								<div {...getItemProps({ style: { background: '#fbbf24', color: '#222' } })}>
									<div {...leftResizeProps} />
									<span>{item.title}</span>
									<div className="text-xs text-gray-700 dark:text-neutral-200">{dateStr}</div>
									<div {...rightResizeProps} />
								</div>
							)
						}}
					/>
				</div>
			</div>
			<div className="flex-none h-[20vh] w-full bg-black dark:bg-neutral-900 px-4 py-2 overflow-y-auto">
				<div className="max-w-7xl mx-auto h-full flex flex-col">
					<h2 className="text-lg font-bold text-center text-white dark:text-neutral-100 mb-2">未排班工作</h2>
					<div className="flex flex-wrap gap-2 justify-center overflow-auto max-h-full">
						{unplanned.length === 0 ? (
							<div className="text-gray-400 dark:text-neutral-400">（無）</div>
						) : unplanned.map(wl => (
							<div
								key={wl.loadId}
								className="bg-yellow-50 dark:bg-yellow-900 border rounded px-3 py-2 text-sm"
								title={`來自 ${wl.epicTitle}`}
							>
								<div className="text-neutral-900 dark:text-neutral-100">{wl.title || '(無標題)'}</div>
								<div className="text-xs text-gray-400 dark:text-neutral-300">
									{Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
			<AdminBottomNav />
		</div>
	)
}

export default WorkScheduleManagementPage