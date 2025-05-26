'use client'

import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav'
import '@/styles/timeline.scss'
import { addDays, differenceInMilliseconds, endOfDay, isValid, parseISO, startOfDay, subDays } from 'date-fns'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
	collection,
	doc,
	DocumentData,
	getFirestore,
	QueryDocumentSnapshot,
	updateDoc
} from 'firebase/firestore'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
	const timelineRef = useRef<HTMLDivElement>(null)

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

	const handleAssignToTimeline = async (
		wlDragged: LooseWorkLoad, // Item from the unplanned list
		targetGroupId: string,    // epicId of the row it was dropped on
		startTime: Date,
		endTime: Date
	) => {
		const originalEpicId = wlDragged.epicId
		const workLoadId = wlDragged.loadId

		const originalEpicState = epics.find(e => e.epicId === originalEpicId)
		if (!originalEpicState || !originalEpicState.workLoads) {
			console.error('Original epic or its workloads not found in state:', originalEpicId)
			return
		}

		const workloadWithNewTimes: WorkLoadEntity = {
			loadId: workLoadId,
			title: wlDragged.title,
			executor: wlDragged.executor,
			plannedStartTime: startTime.toISOString(),
			plannedEndTime: endTime.toISOString()
		}

		if (originalEpicId === targetGroupId) {
			// Case 1: Dropped onto its own epic's row
			const newWorkLoads = originalEpicState.workLoads.map(wl =>
				wl.loadId === workLoadId ? workloadWithNewTimes : wl
			)
			await updateDoc(doc(firestore, 'workEpic', originalEpicId), { workLoads: newWorkLoads })
		} else {
			// Case 2: Dropped onto a different epic's row
			const targetEpicState = epics.find(e => e.epicId === targetGroupId)
			if (!targetEpicState) {
				console.warn(`Target epic ${targetGroupId} not found. Item will be scheduled in its original epic.`)
				// Fallback: schedule in original epic
				const newWorkLoads = originalEpicState.workLoads.map(wl =>
					wl.loadId === workLoadId ? workloadWithNewTimes : wl
				)
				await updateDoc(doc(firestore, 'workEpic', originalEpicId), { workLoads: newWorkLoads })
				return
			}

			// Proceed with move:
			// 1. Remove from original epic's workloads (actually, update the item in original epic to be planned)
			// The item wlDragged is defined by not having plannedStartTime.
			// So, we need to find it in originalEpicState.workLoads and update it or move it.
			const updatedOriginalWorkLoads = originalEpicState.workLoads.filter(
				wl => wl.loadId !== workLoadId
			)

			// 2. Add to target epic's workloads
			const newTargetWorkLoads = [...(targetEpicState.workLoads || []), workloadWithNewTimes]

			// Perform Firestore updates
			await updateDoc(doc(firestore, 'workEpic', originalEpicId), { workLoads: updatedOriginalWorkLoads })
			await updateDoc(doc(firestore, 'workEpic', targetGroupId), { workLoads: newTargetWorkLoads })
		}
	}

	const now = new Date()
	const defaultTimeStart = subDays(startOfDay(now), 7)
	const defaultTimeEnd = addDays(endOfDay(now), 14)

	return (
		<div className="w-full">
			<div className="min-h-screen w-full bg-white dark:bg-neutral-900 flex flex-col">
				{/* Timeline 區塊高度自動扣除底部未排程工作區塊 */}
				<div
					className="flex-1 w-full flex items-center justify-center relative overflow-visible"
					style={{ paddingBottom: '25vh' }}
				>
					<div
						ref={timelineRef}
						className="w-full h-full rounded-2xl bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 shadow overflow-x-auto"
						style={{ width: '100vw', height: '100vh' }}
						onDragOver={e => {
							e.preventDefault()
						}}
						onDrop={e => {
							e.preventDefault()
							try {
								const jsonData = e.dataTransfer.getData('application/json')
								if (!jsonData) { return }
								const droppedWl = JSON.parse(jsonData) as LooseWorkLoad
								const timelineElement = document.querySelector('.react-calendar-timeline')
								if (!timelineElement) { return }
								const rect = timelineElement.getBoundingClientRect()
								const y = e.clientY - rect.top
								const groupHeight = rect.height / groups.length
								const groupIndex = Math.floor(y / groupHeight)
								const group = groups[groupIndex]
								if (!group) { return }
								const groupId = group.id as string
								const timelineWidth = rect.width
								const x = e.clientX - rect.left
								const percent = x / timelineWidth
								const timeRange = defaultTimeEnd.getTime() - defaultTimeStart.getTime()
								const dropTime = new Date(defaultTimeStart.getTime() + percent * timeRange)
								const startTime = dropTime
								const endTime = addDays(startTime, 1)
								handleAssignToTimeline(droppedWl, groupId, startTime, endTime)
							} catch (error) {
								console.error('Error processing dropped item:', error)
							}
						}}
					>
						<div className="w-full h-full">
							<Timeline
								groups={groups}
								items={items}
								defaultTimeStart={defaultTimeStart}
								defaultTimeEnd={defaultTimeEnd}
								canMove
								canResize="both"
								canChangeGroup
								stackItems
								minZoom={7 * 24 * 60 * 60 * 1000}
								maxZoom={30 * 24 * 60 * 60 * 1000}
								lineHeight={40}
								sidebarWidth={150}
								timeSteps={{
									second: 1,
									minute: 1,
									hour: 1,
									day: 1,
									month: 1,
									year: 1
								}}
								onItemMove={handleItemMove}
								onItemResize={(itemId, time, edge) => handleItemResize(itemId as string, time, edge)}
								onItemDoubleClick={handleItemRemove}
								groupRenderer={({ group }) => (
									<div className="px-2 py-1 text-neutral-900 dark:text-neutral-100 border-b border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-neutral-900/80">
										{group.title}
									</div>
								)}
								itemRenderer={({ item, getItemProps, getResizeProps }) => {
									const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
									return (
										<div
											{...getItemProps({
												style: {
													background: '#fbbf24',
													color: '#222',
													borderRadius: '0.75rem',
													border: '1.5px solid #f59e42',
													boxShadow: '0 2px 8px 0 rgba(251,191,36,0.08)',
													padding: '0.25rem 0.75rem',
													display: 'flex',
													alignItems: 'center',
													cursor: 'pointer'
												},
												className: 'hover:bg-yellow-200/80 transition-colors'
											})}
										>
											<div {...leftResizeProps} />
											<span className="line-clamp-2">{item.title}</span>
											<div {...rightResizeProps} />
										</div>
									)
								}}
							/>
						</div>
					</div>
				</div>
				{/* 未排程工作區塊固定在底部，樣式與 owner 版一致 */}
				<div
					className="fixed left-0 right-0 bottom-0 z-50 flex-none min-h-[25vh] max-h-[35vh] w-full bg-blue-50/80 dark:bg-gray-800/80 rounded-t-3xl shadow-inner border-t border-blue-200 dark:border-blue-700 transition-colors"
					style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.08)' }}
				>
					<div className="w-full h-full flex flex-col p-4 mx-auto">
						<h2 className="text-lg font-bold text-center text-blue-800 dark:text-blue-300 mb-4 tracking-wide transition-colors">
							未排程工作
						</h2>
						{unplanned.length === 0 ? (
							<div className="flex items-center justify-center w-full h-full min-h-[60px]">
								<span className="text-gray-400 dark:text-gray-500 text-center transition-colors">
									（無未排程工作）
								</span>
							</div>
						) : (
							<div
								className="flex flex-nowrap gap-3 overflow-x-auto pb-16 px-0.5 w-full max-w-full"
								tabIndex={0}
								aria-label="unplanned-jobs"
							>
								{unplanned.map(wl => (
									<div
										key={wl.loadId}
										draggable={true}
										onDragStart={e => {
											e.dataTransfer.setData('application/json', JSON.stringify(wl))
										}}
										className="bg-white/90 dark:bg-gray-900/90 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2.5 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors hover:shadow-md flex-shrink-0 cursor-grab"
										title={`來自 ${wl.epicTitle}`}
										style={{
											minWidth: '180px',
											maxWidth: '260px',
											boxShadow: '0 2px 8px 0 rgba(59,130,246,0.06)'
										}}
									>
										<div className="font-medium text-gray-700 dark:text-gray-300 text-sm line-clamp-2 transition-colors">
											{wl.title || '（無標題）'}
										</div>
										<div className="text-xs text-blue-600 dark:text-blue-400 transition-colors">
											{Array.isArray(wl.executor) && wl.executor.length > 0 ? wl.executor.join(', ') : '（無執行者）'}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
				<AdminBottomNav />
			</div>
		</div>
	)
}

export default WorkScheduleManagementPage
