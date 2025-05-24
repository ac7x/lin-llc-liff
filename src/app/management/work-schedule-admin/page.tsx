'use client'

import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav'
import {
	addDays,
	differenceInMilliseconds,
	endOfDay,
	format,
	isValid,
	parseISO,
	startOfDay
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import React, { useEffect, useMemo, useState } from 'react'
import Timeline from 'react-calendar-timeline'
import 'react-calendar-timeline/style.css'
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

const groupColors = [
	'#fbbf24', '#60a5fa', '#34d399', '#f87171', '#a78bfa',
	'#f472b6', '#fdba74', '#6ee7b7', '#facc15', '#818cf8'
]

const ClientWorkSchedulePage: React.FC = () => {
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

	const groups = useMemo(() => epics.map(e => ({
		id: e.epicId,
		title: e.title
	})), [epics])

	const groupColorMap = useMemo(() => {
		const map: Record<string, string> = {}
		groups.forEach((group, idx) => {
			map[group.id] = groupColors[idx % groupColors.length]
		})
		return map
	}, [groups])

	const items = useMemo(() =>
		epics.flatMap(e =>
			(e.workLoads || [])
				.filter(l => l.plannedStartTime && l.plannedStartTime !== '')
				.map(l => {
					const start = parseISO(l.plannedStartTime)
					const end = l.plannedEndTime && l.plannedEndTime !== ''
						? parseISO(l.plannedEndTime)
						: addDays(parseISO(l.plannedStartTime), 1)
					return {
						id: l.loadId,
						group: e.epicId,
						title: getWorkloadContent(l),
						start_time: start,
						end_time: end,
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

	return (
		<div style={{ minHeight: '100vh', background: '#f9f9f9', color: '#222', display: 'flex', flexDirection: 'column' }}>
			<div style={{ flex: '1 0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0 }}>
				<div style={{ width: '100vw', height: '70vh', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 1px 4px #0001', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Timeline
						groups={groups}
						items={items}
						defaultTimeStart={startOfDay(addDays(new Date(), -7))}
						defaultTimeEnd={endOfDay(addDays(new Date(), 14))}
						canMove canResize='both' canChangeGroup stackItems
						onItemMove={handleItemMove}
						onItemResize={(itemId, time, edge) => handleItemResize(itemId as string, time, edge)}
						onItemDoubleClick={handleItemRemove}
						itemRenderer={({ item, getItemProps, getResizeProps }) => {
							const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
							const color = groupColorMap[item.group] || '#fbbf24'
							return (
								<div {...getItemProps({ style: { background: color, color: '#222', borderRadius: 4 } })}>
									<div {...leftResizeProps} />
									<span>
										{item.title}
										{/* 範例：顯示起訖時間（繁體中文） */}
										<br />
										<small style={{ color: '#555' }}>
											{format(item.start_time, 'yyyy/MM/dd (EEE) HH:mm', { locale: zhTW })}
											{' ~ '}
											{format(item.end_time, 'yyyy/MM/dd (EEE) HH:mm', { locale: zhTW })}
										</small>
									</span>
									<div {...rightResizeProps} />
								</div>
							)
						}}
					/>
				</div>
			</div>
			<div style={{ flex: 'none', width: '100%', background: '#f9f9f9', padding: 12, overflowY: 'auto' }}>
				<div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
					<h2 style={{ fontWeight: 700, fontSize: 18, textAlign: 'center', marginBottom: 8 }}>未排班工作</h2>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxHeight: 120, overflow: 'auto' }}>
						{unplanned.length === 0 ? (
							<div style={{ color: '#aaa' }}>（無）</div>
						) : unplanned.map(wl => (
							<div
								key={wl.loadId}
								style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '4px 10px', fontSize: 13 }}
								title={`來自 ${wl.epicTitle}`}
							>
								<div>{wl.title || '(無標題)'}</div>
								<div style={{ fontSize: 11, color: '#999' }}>
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

export default ClientWorkSchedulePage