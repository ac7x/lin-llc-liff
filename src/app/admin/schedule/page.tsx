'use client'

import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav'
import { addDays, differenceInMilliseconds, endOfDay, format, isValid, parseISO, startOfDay, subDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
	collection,
	doc,
	DocumentData,
	getFirestore,
	QueryDocumentSnapshot,
	updateDoc
} from 'firebase/firestore'
import React, { useEffect, useMemo, useState } from 'react'
import Timeline, { TimelineGroupBase, TimelineItemBase } from 'react-calendar-timeline'
import 'react-calendar-timeline/style.css'
import { useCollection } from 'react-firebase-hooks/firestore'

const firebaseConfig = {
	apiKey: 'AIzaSyDsJP6_bjWLQ0SQiarhe3UIApnqx60vCqg',
	authDomain: 'lin-llc-liff.firebaseapp.com',
	projectId: 'lin-llc-liff',
	storageBucket: 'lin-llc-liff.firbasestorage.app',
	messagingSenderId: '734381604026',
	appId: '1:734381604026:web:a07a50fe85c6c5acd25683',
	measurementId: 'G-KBMLTJL6KK'
}

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

type LooseWorkLoad = WorkLoadEntity & { epicId: string; epicTitle: string }

/** 解析 Epic Snapshot，取得 epics 與未排班工作 */
const parseEpicSnapshot = (
	docs: QueryDocumentSnapshot<DocumentData, DocumentData>[]
): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } => {
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

const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>): string =>
	`${wl.title || '（無標題）'} | ${Array.isArray(wl.executor) ? wl.executor.join(', ') : '（無執行者）'}`

const WorkScheduleManagementPage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
	const [epicSnapshot] = useCollection(collection(firestore, 'workEpic'))

	useEffect(() => {
		if (!epicSnapshot) { return }
		const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
		setEpics(epics)
		setUnplanned(unplanned)
	}, [epicSnapshot])

	const groupCount = 15
	const groups: TimelineGroupBase[] = useMemo(() => {
		const filledEpics: WorkEpicEntity[] = [...epics]
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

	const items: TimelineItemBase<Date>[] = useMemo(() =>
		epics.flatMap(e =>
			(e.workLoads || [])
				.filter(l => l.plannedStartTime)
				.map(l => {
					const start = parseISO(l.plannedStartTime)
					const end = l.plannedEndTime ? parseISO(l.plannedEndTime) : addDays(start, 1)
					return {
						id: l.loadId,
						group: e.epicId,
						title: getWorkloadContent(l),
						start_time: start,
						end_time: end
					}
				})
		), [epics])

	const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number): Promise<void> => {
		const item = items.find(i => i.id === itemId)
		if (!item) { return }
		const oldEpic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!oldEpic) { return }
		const wlIdx = (oldEpic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) { return }
		const newGroupId = groups[newGroupOrder].id as string
		const newEpic = epics.find(e => e.epicId === newGroupId)
		if (!newEpic) { return }
		const newStart = new Date(dragTime)
		const duration = differenceInMilliseconds(item.end_time as Date, item.start_time as Date)
		const newEnd = new Date(newStart.getTime() + duration)
		if (oldEpic.epicId !== newEpic.epicId) {
			const updatedOldWorkLoads = (oldEpic.workLoads || []).filter(wl => wl.loadId !== itemId)
			await updateDoc(doc(firestore, 'workEpic', oldEpic.epicId), { workLoads: updatedOldWorkLoads })
			const oldWorkload = (oldEpic.workLoads || [])[wlIdx]
			const newWorkLoad: WorkLoadEntity = {
				...oldWorkload,
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString()
			}
			const updatedNewWorkLoads = [...(newEpic.workLoads || []), newWorkLoad]
			await updateDoc(doc(firestore, 'workEpic', newEpic.epicId), { workLoads: updatedNewWorkLoads })
		} else {
			const newWorkLoads = [...(oldEpic.workLoads || [])]
			newWorkLoads[wlIdx] = {
				...newWorkLoads[wlIdx],
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString()
			}
			await updateDoc(doc(firestore, 'workEpic', oldEpic.epicId), { workLoads: newWorkLoads })
		}
	}

	const handleItemResize = async (itemId: string, time: number, edge: 'left' | 'right'): Promise<void> => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) { return }
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) { return }
		const wl = (epic.workLoads || [])[wlIdx]
		let newStart = parseISO(wl.plannedStartTime)
		let newEnd = wl.plannedEndTime ? parseISO(wl.plannedEndTime) : undefined
		if (edge === 'left') { newStart = new Date(time) }
		if (edge === 'right') { newEnd = new Date(time) }
		const newWorkLoads = [...(epic.workLoads || [])]
		newWorkLoads[wlIdx] = {
			...wl,
			plannedStartTime: newStart.toISOString(),
			plannedEndTime: newEnd && isValid(newEnd) ? newEnd.toISOString() : ''
		}
		await updateDoc(doc(firestore, 'workEpic', epic.epicId), { workLoads: newWorkLoads })
	}

	const handleItemRemove = async (itemId: string): Promise<void> => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) { return }
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) { return }
		const newWorkLoads = [...(epic.workLoads || [])]
		const updateWL = { ...newWorkLoads[wlIdx], plannedStartTime: '', plannedEndTime: '' }
		newWorkLoads[wlIdx] = updateWL
		await updateDoc(doc(firestore, 'workEpic', epic.epicId), { workLoads: newWorkLoads })
	}

	const handleUnplannedClick = (wl: LooseWorkLoad) => {
		const now = new Date()
		const todayStart = startOfDay(now)
		const tomorrow = addDays(todayStart, 1)
		handleAssignToTimeline(wl, wl.epicId, todayStart, tomorrow)
	}

	const handleAssignToTimeline = async (
		wl: LooseWorkLoad,
		groupId: string,
		start: Date,
		end: Date
	) => {
		const epic = epics.find(e => e.epicId === groupId)
		if (!epic) { return }
		const wlIdx = (epic.workLoads || []).findIndex(x => x.loadId === wl.loadId)
		if (wlIdx === -1) { return }
		const newWorkLoads = [...(epic.workLoads || [])]
		newWorkLoads[wlIdx] = {
			...newWorkLoads[wlIdx],
			plannedStartTime: start.toISOString(),
			plannedEndTime: end.toISOString()
		}
		await updateDoc(doc(firestore, 'workEpic', epic.epicId), { workLoads: newWorkLoads })
	}

	const now = new Date()
	const defaultTimeStart = subDays(startOfDay(now), 7)
	const defaultTimeEnd = addDays(endOfDay(now), 14)

	return (
		<div>
			<h1>工作排程管理</h1>
			<Timeline
				groups={groups}
				items={items}
				defaultTimeStart={defaultTimeStart}
				defaultTimeEnd={defaultTimeEnd}
				canMove
				canResize="both"
				canChangeGroup
				stackItems
				onItemMove={handleItemMove}
				onItemResize={(itemId, time, edge) => handleItemResize(itemId as string, time, edge)}
				onItemDoubleClick={handleItemRemove}
				itemRenderer={({ item, getItemProps, getResizeProps }) => {
					const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
					const dateStr = `${format(item.start_time as Date, 'yyyy/MM/dd (EEE) HH:mm', { locale: zhTW })} - ${format(item.end_time as Date, 'yyyy/MM/dd (EEE) HH:mm', { locale: zhTW })}`
					return (
						<div {...getItemProps({ style: { background: '#fbbf24', color: '#222', borderRadius: 6 } })}>
							<div {...leftResizeProps} />
							<span>{item.title}</span>
							<div>{dateStr}</div>
							<div {...rightResizeProps} />
						</div>
					)
				}}
			/>
			<div>
				<h2>未排班工作</h2>
				{unplanned.length === 0 ? (
					<div>（無）</div>
				) : unplanned.map(wl => (
					<button
						key={wl.loadId}
						type="button"
						onClick={() => handleUnplannedClick(wl)}
					>
						<span>{wl.title || '（無標題）'}</span>
						<span>{wl.executor.join(', ') || '（無執行者）'}</span>
						<span>點擊快速排入今日</span>
					</button>
				))}
			</div>
			<AdminBottomNav />
		</div>
	)
}

export default WorkScheduleManagementPage