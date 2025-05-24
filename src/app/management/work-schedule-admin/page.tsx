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
import React, { useEffect, useMemo, useState } from 'react'
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
	useEffect(() => {
		fetchEpics()
	}, [])

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

	// 同步預設畫面區間
	const now = new Date()
	const defaultTimeStart = subDays(startOfDay(now), 7)
	const defaultTimeEnd = addDays(endOfDay(now), 14)

	return (
		<div className="min-h-screen w-full bg-black flex flex-col">
			<div className="flex-none h-[20vh]" />
			<div className="flex-none h-[60vh] w-full flex items-center justify-center relative">
				<div className="w-full h-full rounded-2xl border border-gray-300 shadow overflow-hidden bg-black" style={{ minWidth: '100vw', height: 400 }}>
					<Timeline
						groups={groups}
						items={items}
						defaultTimeStart={defaultTimeStart}
						defaultTimeEnd={defaultTimeEnd}
						canMove
						canResize="both"
						canChangeGroup
						stackItems
						minZoom={24 * 60 * 60 * 1000} // 1日
						maxZoom={30 * 24 * 60 * 60 * 1000} // 30日
						onItemMove={handleItemMove}
						onItemResize={(itemId, time, edge) => handleItemResize(itemId as string, time, edge)}
						onItemDoubleClick={handleItemRemove}
						groupRenderer={({ group }) => (
							<div className="px-2 py-1 rounded text-white font-bold">
								{group.title}
							</div>
						)}
						itemRenderer={({ item, getItemProps, getResizeProps }) => {
							const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
							// 日期格式本地化
							const dateStr = `${format(item.start_time, 'yyyy/MM/dd (EEE) HH:mm', { locale: zhTW })} - ${format(item.end_time, 'yyyy/MM/dd (EEE) HH:mm', { locale: zhTW })}`
							return (
								<div
									{...getItemProps({
										className: `rounded-lg px-3 py-2 shadow text-white font-bold bg-opacity-90 hover:opacity-90 transition-colors`,
										style: { minHeight: 38 }
									})}
								>
									<div {...leftResizeProps} />
									<span>{item.title}</span>
									<div className="text-xs text-white/80 font-normal">{dateStr}</div>
									<div {...rightResizeProps} />
								</div>
							)
						}}
					/>
				</div>
			</div>
			<div className="flex-none h-[20vh] w-full bg-black">
				<div className="w-full h-full flex flex-col p-4 max-w-[100vw] mx-auto">
					<h2 className="text-lg font-bold text-center text-white mb-2 tracking-wide">
						未排班工作
					</h2>
					<div className="flex flex-wrap gap-3 overflow-y-auto pb-16 px-0.5">
						{unplanned.length === 0 ? (
							<div className="text-gray-400 text-center w-full">（無）</div>
						) : unplanned.map(wl => (
							<div
								key={wl.loadId}
								className="
									bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5
									hover:bg-yellow-100 transition-all hover:shadow-md
									flex flex-col justify-between gap-2
									flex-auto min-w-[180px] max-w-full
								"
								title={`來自 ${wl.epicTitle}`}
							>
								<div className="font-medium text-gray-700 text-sm line-clamp-2">
									{wl.title || '(無標題)'}
								</div>
								<div className="text-xs text-gray-500">
									{Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
			<ManagementBottomNav />
		</div>
	)
}

export default WorkScheduleAdminPage