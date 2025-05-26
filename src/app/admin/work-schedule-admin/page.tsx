'use client'

import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav'
import '@/styles/timeline.scss'
import {
	addDays,
	differenceInMilliseconds,
	endOfDay,
	format,
	isValid,
	parseISO,
	startOfDay,
	subDays
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Timeline from 'react-calendar-timeline'
import {
	getAllWorkEpics,
	updateWorkEpicWorkLoads
} from './work-schedule-admin.action'

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

const parseEpicSnapshot = (
	docs: WorkEpicEntity[]
): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } => {
	const epics = docs.map(doc => ({ ...doc, epicId: doc.epicId }))
	const unplanned = epics.flatMap(e =>
		(e.workLoads ?? [])
			.filter(l => !l.plannedStartTime)
			.map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
	)
	return { epics, unplanned }
}

const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>) => {
	const title = wl.title || t("No Title")
	const executor = Array.isArray(wl.executor) && wl.executor.length > 0
		? wl.executor.join(', ')
		: t("No Executor")
	return `${title} | ${executor}`
}

function t(str: string): string {
	return str
}

const WorkScheduleAdminPage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])

	const fetchEpics = useCallback(async (): Promise<void> => {
		const docs = await getAllWorkEpics()
		const { epics: newEpics, unplanned: newUnplanned } = parseEpicSnapshot(docs as WorkEpicEntity[])
		setEpics(newEpics)
		setUnplanned(newUnplanned)
	}, [])

	useEffect(() => { fetchEpics() }, [fetchEpics])

	const groupCount = 10
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
			(e.workLoads ?? [])
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
		), [epics]
	)

	const handleItemMove = useCallback(async (itemId: string, dragTime: number, newGroupOrder: number): Promise<void> => {
		const item = items.find(i => i.id === itemId)
		if (!item) return
		const oldEpic = epics.find(e => (e.workLoads ?? []).some(wl => wl.loadId === itemId))
		if (!oldEpic) return
		const wlIdx = (oldEpic.workLoads ?? []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return
		const newGroupId = groups[newGroupOrder].id
		const newEpic = epics.find(e => e.epicId === newGroupId)
		if (!newEpic) return
		const newStart = new Date(dragTime)
		const duration = differenceInMilliseconds(item.end_time, item.start_time)
		const newEnd = new Date(newStart.getTime() + duration)
		if (oldEpic.epicId !== newEpic.epicId) {
			const updatedOldWorkLoads = (oldEpic.workLoads ?? []).filter(wl => wl.loadId !== itemId)
			await updateWorkEpicWorkLoads(oldEpic.epicId, updatedOldWorkLoads)
			const oldWorkload = (oldEpic.workLoads ?? [])[wlIdx]
			const newWorkLoad: WorkLoadEntity = {
				...oldWorkload,
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString()
			}
			const updatedNewWorkLoads = [...(newEpic.workLoads ?? []), newWorkLoad]
			await updateWorkEpicWorkLoads(newEpic.epicId, updatedNewWorkLoads)
		} else {
			const newWorkLoads = [...(oldEpic.workLoads ?? [])]
			newWorkLoads[wlIdx] = {
				...newWorkLoads[wlIdx],
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString()
			}
			await updateWorkEpicWorkLoads(oldEpic.epicId, newWorkLoads)
		}
		await fetchEpics()
	}, [epics, groups, items, fetchEpics])

	const handleItemResize = useCallback(async (itemId: string, time: number, edge: 'left' | 'right'): Promise<void> => {
		const epic = epics.find(e => (e.workLoads ?? []).some(wl => wl.loadId === itemId))
		if (!epic) return
		const wlIdx = (epic.workLoads ?? []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return
		const wl = (epic.workLoads ?? [])[wlIdx]
		let newStart = parseISO(wl.plannedStartTime)
		let newEnd = wl.plannedEndTime ? parseISO(wl.plannedEndTime) : undefined
		if (edge === 'left') newStart = new Date(time)
		if (edge === 'right') newEnd = new Date(time)
		const newWorkLoads = [...(epic.workLoads ?? [])]
		newWorkLoads[wlIdx] = {
			...wl,
			plannedStartTime: newStart.toISOString(),
			plannedEndTime: newEnd && isValid(newEnd) ? newEnd.toISOString() : ''
		}
		await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
		await fetchEpics()
	}, [epics, fetchEpics])

	const handleItemRemove = useCallback(async (itemId: string): Promise<void> => {
		const epic = epics.find(e => (e.workLoads ?? []).some(wl => wl.loadId === itemId))
		if (!epic) return
		const wlIdx = (epic.workLoads ?? []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return
		const newWorkLoads = [...(epic.workLoads ?? [])]
		newWorkLoads[wlIdx] = { ...newWorkLoads[wlIdx], plannedStartTime: '', plannedEndTime: '' }
		await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
		await fetchEpics()
	}, [epics, fetchEpics])

	const now = new Date()
	const defaultTimeStart = subDays(startOfDay(now), 7)
	const defaultTimeEnd = addDays(endOfDay(now), 14)

	const timelineRef = useRef<HTMLDivElement>(null)

	const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad): void => {
		e.dataTransfer.setData('application/json', JSON.stringify(wl))
	}, [])

	const handleTimelineDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
		e.preventDefault()
	}, [])

	const handleTimelineDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		const data = e.dataTransfer.getData('application/json')
		if (!data) return
		const wl: LooseWorkLoad = JSON.parse(data)
		const timelineDiv = timelineRef.current
		if (!timelineDiv) return
		const rect = timelineDiv.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top
		const groupHeight = 41
		const groupIndex = Math.floor(y / groupHeight)
		const group = groups[groupIndex]
		if (!group) return
		const timelineWidth = rect.width
		const msPerPixel = (defaultTimeEnd.getTime() - defaultTimeStart.getTime()) / timelineWidth
		const time = defaultTimeStart.getTime() + x * msPerPixel
		const start = new Date(time)
		const end = addDays(start, 1)
		const epic = epics.find(e => e.epicId === group.id)
		if (!epic) return
		const newWorkLoads = [...(epic.workLoads ?? []), {
			...wl,
			plannedStartTime: start.toISOString(),
			plannedEndTime: end.toISOString()
		}]
		await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
		await fetchEpics()
	}, [groups, defaultTimeEnd, defaultTimeStart, epics, fetchEpics])

	return (
		<div className="w-full">
			<div className="min-h-screen w-full bg-white dark:bg-neutral-900 flex flex-col">
				<div className="flex-1 w-full flex items-center justify-center relative overflow-visible">
					<div
						ref={timelineRef}
						className="w-full h-full rounded-2xl bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 shadow overflow-x-auto"
						style={{ width: '100vw', height: '100vh' }}
						onDragOver={handleTimelineDragOver}
						onDrop={handleTimelineDrop}
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
									minZoom={24 * 60 * 60 * 1000}
									maxZoom={30 * 24 * 60 * 60 * 1000}
									onItemMove={handleItemMove}
									onItemResize={(itemId, time, edge) => handleItemResize(itemId as string, time, edge)}
									onItemDoubleClick={handleItemRemove}
									groupRenderer={({ group }) => (
										<div className="px-2 py-1 text-neutral-900 dark:text-neutral-100">
											{group.title}
										</div>
									)}
									itemRenderer={({ item, getItemProps, getResizeProps }) => {
										const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
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
				</div>
				<div className="flex-none min-h-[25vh] max-h-[35vh] w-full bg-blue-50/80 dark:bg-gray-800/80 rounded-t-3xl shadow-inner transition-colors">
					<div className="w-full h-full flex flex-col p-4 mx-auto">
						<h2 className="text-lg font-bold text-center text-blue-800 dark:text-blue-300 mb-4 tracking-wide transition-colors">
							{t("Unplanned Work")}
						</h2>
						{unplanned.length === 0 ? (
							<div className="flex items-center justify-center w-full h-full min-h-[60px]">
								<span className="text-gray-400 dark:text-gray-500 text-center transition-colors">
									{t("No Unplanned Work")}
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
										className="bg-white/90 dark:bg-gray-900/90 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors hover:shadow-md flex-shrink-0"
										title={`${t("From")} ${wl.epicTitle}`}
										draggable
										onDragStart={e => handleDragStart(e, wl)}
									>
										<div className="font-medium text-gray-700 dark:text-gray-300 text-sm line-clamp-2 transition-colors">
											{wl.title || t("No Title")}
										</div>
										<div className="text-xs text-blue-600 dark:text-blue-400 transition-colors">
											{Array.isArray(wl.executor) && wl.executor.length > 0
												? wl.executor.join(', ')
												: t("No Executor")}
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

export default WorkScheduleAdminPage
