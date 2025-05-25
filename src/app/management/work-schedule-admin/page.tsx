'use client'

import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav'
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
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
type LooseWorkLoad = WorkLoadEntity & { epicId: string, epicTitle: string }

const parseEpicSnapshot = (
	docs: WorkEpicEntity[]
): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } => {
	const epics: WorkEpicEntity[] = docs.map(
		doc => ({ ...doc, epicId: doc.epicId } as WorkEpicEntity)
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

const WorkScheduleAdminPage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])

	const fetchEpics = async () => {
		const docs = await getAllWorkEpics()
		const { epics, unplanned } = parseEpicSnapshot(docs as WorkEpicEntity[])
		setEpics(epics)
		setUnplanned(unplanned)
	}
	useEffect(() => { fetchEpics() }, [])

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
		epics.flatMap((e) =>
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
						end_time: end
					}
				})
		), [epics]
	)

	const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number) => {
		const item = items.find(i => i.id === itemId)
		if (!item) return
		const oldEpic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!oldEpic) return
		const wlIdx = (oldEpic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return
		const newGroupId = groups[newGroupOrder].id
		const newEpic = epics.find(e => e.epicId === newGroupId)
		if (!newEpic) return
		const newStart = new Date(dragTime)
		const duration = differenceInMilliseconds(item.end_time, item.start_time)
		const newEnd = new Date(newStart.getTime() + duration)
		if (oldEpic.epicId !== newEpic.epicId) {
			const updatedOldWorkLoads = (oldEpic.workLoads || []).filter(wl => wl.loadId !== itemId)
			await updateWorkEpicWorkLoads(oldEpic.epicId, updatedOldWorkLoads)
			const oldWorkload = (oldEpic.workLoads || [])[wlIdx]
			const newWorkLoad: WorkLoadEntity = {
				...oldWorkload,
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
			const updatedNewWorkLoads = [...(newEpic.workLoads || []), newWorkLoad]
			await updateWorkEpicWorkLoads(newEpic.epicId, updatedNewWorkLoads)
		} else {
			const newWorkLoads = [...(oldEpic.workLoads || [])]
			newWorkLoads[wlIdx] = {
				...newWorkLoads[wlIdx],
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
			await updateWorkEpicWorkLoads(oldEpic.epicId, newWorkLoads)
		}
		await fetchEpics()
	}

	const handleItemResize = async (itemId: string, time: number, edge: 'left' | 'right') => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) return
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return
		const wl = (epic.workLoads || [])[wlIdx]
		let newStart = parseISO(wl.plannedStartTime)
		let newEnd = wl.plannedEndTime && wl.plannedEndTime !== '' ? parseISO(wl.plannedEndTime) : undefined
		if (edge === 'left') newStart = new Date(time)
		if (edge === 'right') newEnd = new Date(time)
		const newWorkLoads = [...(epic.workLoads || [])]
		newWorkLoads[wlIdx] = {
			...wl,
			plannedStartTime: newStart.toISOString(),
			plannedEndTime: newEnd && isValid(newEnd) ? newEnd.toISOString() : '',
		}
		await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
		await fetchEpics()
	}

	const handleItemRemove = async (itemId: string) => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) return
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return
		const newWorkLoads = [...(epic.workLoads || [])]
		const updateWL = { ...newWorkLoads[wlIdx], plannedStartTime: '', plannedEndTime: '' }
		newWorkLoads[wlIdx] = updateWL
		await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
		await fetchEpics()
	}

	const now = new Date()
	const defaultTimeStart = subDays(startOfDay(now), 7)
	const defaultTimeEnd = addDays(endOfDay(now), 14)

	const handleDragStart = (e: React.DragEvent, wl: LooseWorkLoad) => {
		e.dataTransfer.setData('application/json', JSON.stringify(wl))
	}

	const timelineRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = timelineRef.current?.querySelector('.rct-scroll')
		if (container) {
			container.addEventListener('dragover', e => e.preventDefault())
			container.addEventListener('drop', async e => {
				e.preventDefault()
				const data = e.dataTransfer.getData('application/json')
				if (!data) return
				const wl: LooseWorkLoad = JSON.parse(data)

				const rect = container.getBoundingClientRect()
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
				const newWorkLoads = [...(epic.workLoads || []), {
					...wl,
					plannedStartTime: start.toISOString(),
					plannedEndTime: end.toISOString()
				}]
				await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
				await fetchEpics()
			})
		}
	}, [groups, epics])

	return (
		<div className="flex flex-col min-h-screen bg-black dark:bg-neutral-900 relative">
			{/* 時間軸容器區塊 */}
			<div className="flex-grow h-[60vh] relative z-0">
				<div ref={timelineRef} className="w-full h-full overflow-hidden bg-white dark:bg-neutral-800 border-t border-neutral-700">
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

			{/* 未排班工作區塊 */}
			<div className="fixed left-0 right-0 bottom-0 h-[40vh] z-10 bg-blue-50/80 dark:bg-gray-800/80 rounded-t-3xl shadow-inner transition-colors duration-300 pt-4">
				<div className="h-full flex flex-col px-4 pb-16">
					<h2 className="text-lg font-bold text-center text-blue-800 dark:text-blue-300 mb-2">
						未排班工作
					</h2>
					{unplanned.length === 0 ? (
						<div className="flex items-center justify-center flex-grow">
							<span className="text-gray-400 dark:text-gray-500">
								（無未排班工作）
							</span>
						</div>
					) : (
						<div className="flex flex-nowrap gap-3 overflow-x-auto pb-2">
							{unplanned.map(wl => (
								<div
									key={wl.loadId}
									className="bg-white/90 dark:bg-gray-900/90 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors duration-300 hover:shadow-md flex flex-col min-w-[180px]"
									draggable
									onDragStart={e => handleDragStart(e, wl)}
									title={`來自 ${wl.epicTitle}`}
								>
									<div className="font-medium text-gray-700 dark:text-gray-300 text-sm">
										{wl.title || '(無標題)'}
									</div>
									<div className="text-xs text-blue-600 dark:text-blue-400">
										{Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
				{/* 底部導航列 */}
				<div className="absolute bottom-0 left-0 right-0">
					<ManagementBottomNav />
				</div>
			</div>
		</div>
	)
}

export default WorkScheduleAdminPage