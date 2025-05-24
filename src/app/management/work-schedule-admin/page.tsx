'use client'

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import moment from 'moment'
import React, { useEffect, useMemo, useState } from "react"
import Timeline from "react-calendar-timeline"
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
			.filter(l => !l.plannedStartTime || l.plannedStartTime === "")
			.map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
	)
	return { epics, unplanned }
}

const getWorkloadContent = (wl: Pick<WorkLoadEntity, "title" | "executor">) =>
	`${wl.title || "(無標題)"} | ${Array.isArray(wl.executor) ? wl.executor.join(", ") : wl.executor || "(無執行者)"}`

// 定義顏色映射，可依需求擴充
const groupColors = [
	"#fbbf24", // amber
	"#60a5fa", // blue
	"#34d399", // green
	"#f87171", // red
	"#a78bfa", // purple
	"#f472b6", // pink
	"#fdba74", // orange
	"#6ee7b7", // teal
	"#facc15", // yellow
	"#818cf8"  // indigo
]

const ClientWorkSchedulePage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])

	// 1. 取得 Firestore 的排班資料（改為 server action）
	const fetchEpics = async () => {
		const docs = await getAllWorkEpics()
		const { epics, unplanned } = parseEpicSnapshot(docs as WorkEpicEntity[])
		setEpics(epics)
		setUnplanned(unplanned)
	}
	useEffect(() => {
		fetchEpics()
	}, [])

	// 2. 將 Firestore 資料轉為 Timeline groups/items 格式
	const groups = useMemo(() => epics.map(e => ({
		id: e.epicId,
		title: e.title
	})), [epics])

	// groupId => color 的對應表
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
				.filter(l => l.plannedStartTime && l.plannedStartTime !== "")
				.map(l => ({
					id: l.loadId,
					group: e.epicId,
					title: getWorkloadContent(l),
					start_time: moment(l.plannedStartTime),
					end_time: l.plannedEndTime && l.plannedEndTime !== ""
						? moment(l.plannedEndTime)
						: moment(l.plannedStartTime).add(1, "day"),
				}))
		)
		, [epics])

	// 3. 操作：移動/改時間/改 group
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

		const newStart = moment(dragTime)
		const duration = moment(item.end_time).diff(moment(item.start_time), 'milliseconds')
		const newEnd = newStart.clone().add(duration, 'milliseconds')

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

	// 4. 調整區段長度
	const handleItemResize = async (itemId: string, time: number, edge: 'left' | 'right') => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) return
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return

		const wl = (epic.workLoads || [])[wlIdx]
		let newStart = moment(wl.plannedStartTime)
		let newEnd = moment(wl.plannedEndTime && wl.plannedEndTime !== "" ? wl.plannedEndTime : undefined)
		if (edge === 'left') newStart = moment(time)
		if (edge === 'right') newEnd = moment(time)
		const newWorkLoads = [...(epic.workLoads || [])]
		newWorkLoads[wlIdx] = {
			...wl,
			plannedStartTime: newStart.toISOString(),
			plannedEndTime: newEnd.isValid() ? newEnd.toISOString() : "",
		}
		await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
		await fetchEpics()
	}

	// 5. 刪除（丟回未排班區）
	const handleItemRemove = async (itemId: string) => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) return
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) return

		const newWorkLoads = [...(epic.workLoads || [])]
		const updateWL = { ...newWorkLoads[wlIdx], plannedStartTime: "", plannedEndTime: "" }
		newWorkLoads[wlIdx] = updateWL
		await updateWorkEpicWorkLoads(epic.epicId, newWorkLoads)
		await fetchEpics()
	}

	return (
		<div className="min-h-screen w-full bg-background text-foreground flex flex-col">
			<div className="flex-none h-[20vh]" />
			<div className="flex-none h-[60vh] w-full flex items-center justify-center relative p-0 m-0">
				<div className="w-full h-full rounded-2xl bg-white border border-gray-300 shadow overflow-hidden flex items-center justify-center" style={{ minWidth: '100vw', height: '100%' }}>
					<div className="w-full h-full flex items-center justify-center">
						<Timeline
							groups={groups}
							items={items}
							defaultTimeStart={moment().startOf('day').subtract(7, 'days')}
							defaultTimeEnd={moment().endOf('day').add(14, 'days')}
							canMove canResize="both" canChangeGroup stackItems
							onItemMove={handleItemMove}
							onItemResize={(itemId, time, edge) => handleItemResize(itemId as string, time, edge)}
							onItemDoubleClick={handleItemRemove}
							itemRenderer={({ item, getItemProps, getResizeProps }) => {
								const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
								const color = groupColorMap[item.group] || "#fbbf24"
								return (
									<div {...getItemProps({ style: { background: color, color: "#222" } })}>
										<div {...leftResizeProps} />
										<span>{item.title}</span>
										<div {...rightResizeProps} />
									</div>
								)
							}}
						/>
					</div>
				</div>
			</div>
			<div className="flex-none h-[20vh] w-full bg-background px-4 py-2 overflow-y-auto">
				<div className="max-w-7xl mx-auto h-full flex flex-col">
					<h2 className="text-lg font-bold text-center text-foreground mb-2">未排班工作</h2>
					<div className="flex flex-wrap gap-2 justify-center overflow-auto max-h-full">
						{unplanned.length === 0 ? (
							<div className="text-gray-400">（無）</div>
						) : unplanned.map(wl => (
							<div
								key={wl.loadId}
								className="bg-yellow-50 border rounded px-3 py-2 text-sm"
								title={`來自 ${wl.epicTitle}`}
							>
								<div>{wl.title || '(無標題)'}</div>
								<div className="text-xs text-gray-400">
									{Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
			<ClientBottomNav />
		</div>
	)
}

export default ClientWorkSchedulePage