'use client'

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { initializeApp } from "firebase/app"
import {
	collection,
	doc,
	DocumentData,
	getFirestore,
	QueryDocumentSnapshot,
	updateDoc,
} from "firebase/firestore"
import moment from 'moment'
import React, { useEffect, useMemo, useState } from "react"
import Timeline from "react-calendar-timeline"
import 'react-calendar-timeline/style.css'
import { useCollection } from "react-firebase-hooks/firestore"

// Firebase config
const firebaseConfig = {
	apiKey: "AIzaSyDsJP6_bjWLQ0SQiarhe3UIApnqx60vCqg",
	authDomain: "lin-llc-liff.firebaseapp.com",
	projectId: "lin-llc-liff",
	storageBucket: "lin-llc-liff.firebasestorage.app",
	messagingSenderId: "734381604026",
	appId: "1:734381604026:web:a07a50fe85c6c5acd25683",
	measurementId: "G-KBMLTJL6KK"
}
const app = initializeApp(firebaseConfig)
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
	const [epicSnapshot, epicLoading] = useCollection(collection(firestore, "workEpic"))

	// 1. 取得 Firestore 的排班資料
	useEffect(() => {
		if (!epicSnapshot) return
		const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
		setEpics(epics)
		setUnplanned(unplanned)
	}, [epicSnapshot])

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
			await updateDoc(doc(firestore, "workEpic", oldEpic.epicId), { workLoads: updatedOldWorkLoads })
			const oldWorkload = (oldEpic.workLoads || [])[wlIdx]
			const newWorkLoad: WorkLoadEntity = {
				...oldWorkload,
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
			const updatedNewWorkLoads = [...(newEpic.workLoads || []), newWorkLoad]
			await updateDoc(doc(firestore, "workEpic", newEpic.epicId), { workLoads: updatedNewWorkLoads })
		} else {
			const newWorkLoads = [...(oldEpic.workLoads || [])]
			newWorkLoads[wlIdx] = {
				...newWorkLoads[wlIdx],
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
			await updateDoc(doc(firestore, "workEpic", oldEpic.epicId), { workLoads: newWorkLoads })
		}
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
		await updateDoc(doc(firestore, "workEpic", epic.epicId), { workLoads: newWorkLoads })
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
		await updateDoc(doc(firestore, "workEpic", epic.epicId), { workLoads: newWorkLoads })
	}

	return (
		<div className="min-h-screen w-full bg-black flex flex-col">
			<div className="flex-none h-[20vh]" />
			<div className="flex-none h-[60vh] w-full flex items-center justify-center relative p-0 m-0">
				{epicLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
						<div className="text-white">資料載入中...</div>
					</div>
				)}
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
			<div className="flex-none h-[20vh] w-full bg-black px-4 py-2 overflow-y-auto">
				<div className="max-w-7xl mx-auto h-full flex flex-col">
					<h2 className="text-lg font-bold text-center text-white mb-2">未排班工作</h2>
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