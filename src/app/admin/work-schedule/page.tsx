'use client'

import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav'
import { addDays, differenceInMilliseconds, parseISO } from 'date-fns'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
	collection,
	doc,
	getFirestore,
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

/**
 * 工作負載實體
 */
interface WorkLoadEntity {
	loadId: string
	title: string
	executor: string[]
	plannedStartTime: string
	plannedEndTime: string
}

/**
 * 史詩實體
 */
interface WorkEpicEntity {
	epicId: string
	title: string
	workLoads?: WorkLoadEntity[]
}

const WorkScheduleManagementPage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [epicSnapshot] = useCollection(collection(firestore, 'workEpic'))

	useEffect(() => {
		if (!epicSnapshot) return
		const es: WorkEpicEntity[] = epicSnapshot.docs.map(
			doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity)
		)
		setEpics(es)
	}, [epicSnapshot])

	const groups: TimelineGroupBase[] = useMemo(
		() => epics.map(e => ({ id: e.epicId, title: e.title })),
		[epics]
	)

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
						title: l.title,
						start_time: start,
						end_time: end
					}
				})
		), [epics])

	/**
	 * 計算時間軸的預設顯示範圍
	 */
	const { defaultTimeStart, defaultTimeEnd } = useMemo(() => {
		if (items.length === 0) {
			const now = new Date()
			return {
				defaultTimeStart: addDays(now, -1),
				defaultTimeEnd: addDays(now, 2)
			}
		}
		const startTimes = items.map(i => i.start_time as Date)
		const endTimes = items.map(i => i.end_time as Date)
		const minStart = new Date(Math.min(...startTimes.map(d => d.getTime())))
		const maxEnd = new Date(Math.max(...endTimes.map(d => d.getTime())))
		return {
			defaultTimeStart: addDays(minStart, -1),
			defaultTimeEnd: addDays(maxEnd, 1)
		}
	}, [items])

	/**
	 * 移動項目時的處理
	 */
	const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number): Promise<void> => {
		const item = items.find(i => i.id === itemId)
		if (!item) return
		const oldEpic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!oldEpic) return
		const wlIdx = (oldEpic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return
		const newGroupId = groups[newGroupOrder].id as string
		const newEpic = epics.find(e => e.epicId === newGroupId)
		if (!newEpic) return
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

	return (
		<div style={{ width: '100vw', height: '100vh', background: '#111' }}>
			<main style={{ width: '100vw', height: '100vh', background: '#fff' }}>
				<Timeline
					groups={groups}
					items={items}
					canMove
					canResize={false}
					canChangeGroup
					stackItems
					onItemMove={handleItemMove}
					defaultTimeStart={defaultTimeStart}
					defaultTimeEnd={defaultTimeEnd}
				/>
			</main>
			<AdminBottomNav />
		</div>
	)
}

export default WorkScheduleManagementPage
