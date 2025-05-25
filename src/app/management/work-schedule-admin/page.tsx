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

	// 同步預設畫面區間
	const now = new Date()
	const defaultTimeStart = subDays(startOfDay(now), 7)
	const defaultTimeEnd = addDays(endOfDay(now), 14)

	// 拖曳處理
	const handleDragStart = (e: React.DragEvent, wl: LooseWorkLoad) => {
		e.dataTransfer.setData('application/json', JSON.stringify(wl))
	}

	const timelineRef = React.useRef<HTMLDivElement>(null)

	const handleTimelineDragOver = (e: React.DragEvent) => {
		e.preventDefault()
	}

	const handleTimelineDrop = async (e: React.DragEvent) => {
		e.preventDefault()
		const data = e.dataTransfer.getData('application/json')
		if (!data) return
		const wl: LooseWorkLoad = JSON.parse(data)
		// 取得滑鼠於 timeline 的座標
		const timelineDiv = timelineRef.current
		if (!timelineDiv) return

		const rect = timelineDiv.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		// 計算 group
		// Timeline group 高度預設 41px
		const groupHeight = 41
		const groupIndex = Math.floor(y / groupHeight)
		const group = groups[groupIndex]
		if (!group) return

		// 計算時間
		const timelineWidth = rect.width
		const msPerPixel = (defaultTimeEnd.getTime() - defaultTimeStart.getTime()) / timelineWidth
		const time = defaultTimeStart.getTime() + x * msPerPixel
		const start = new Date(time)
		const end = addDays(start, 1)

		// 新增到 group
		const epic = epics.find(e => e.epicId === group.id)
		if (!epic) return
		const newWorkLoads = [...(epic.workLoads || []), {
			...wl,
			plannedStartTime: start.toISOString(),
			plannedEndTime: end.toISOString()
		}]
		await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
		await fetchEpics()
	}

	return (
		<main className="min-h-screen w-full flex flex-col bg-light dark:bg-neutral-900">
			<header className="flex-none bg-gray-100 dark:bg-gray-700 h-16 shadow-lg flex items-center justify-center">
				<h1 className="text-xl font-bold text-gray-900 dark:text-white">
					工作排程管理
				</h1>
			</header>
			<section className="flex-auto overflow-y-auto p-4">
				<div
					ref={timelineRef}
					className="rounded-lg bg-white shadow-md dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600"
					style={{ height: '60vh' }}
					onDragOver={handleTimelineDragOver}
					onDrop={handleTimelineDrop}
				>
					<Timeline
						groups={groups}
						items={items}
						defaultTimeStart={defaultTimeStart}
						defaultTimeEnd={defaultTimeEnd}