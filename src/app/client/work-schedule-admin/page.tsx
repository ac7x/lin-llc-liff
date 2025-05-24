'use client'

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { addDays } from "date-fns"
import { initializeApp } from "firebase/app"
import {
	collection,
	doc,
	DocumentData,
	getFirestore,
	QueryDocumentSnapshot,
	updateDoc,
} from "firebase/firestore"
import React, { useEffect, useRef, useState } from "react"
import { useCollection } from "react-firebase-hooks/firestore"
import { DataSet, Timeline, TimelineOptions } from "vis-timeline/standalone"
import "vis-timeline/styles/vis-timeline-graph2d.min.css"

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
	`<div><div>${wl.title || "(無標題)"}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(", ") : wl.executor || "(無執行者)"}</div></div>`

// vis-timeline 的 change 事件型別
interface TimelineChangeEventProps {
	items: string[]
	data: Record<string, {
		id: string
		group: string
		start: Date
		end?: Date
		[key: string]: unknown
	}>
}

const WorkScheduleAdminPage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
	const timelineRef = useRef<HTMLDivElement>(null)
	const [epicSnapshot, epicLoading] = useCollection(collection(firestore, "workEpic"))

	useEffect(() => {
		if (!epicSnapshot) return
		const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
		setEpics(epics)
		setUnplanned(unplanned)
	}, [epicSnapshot])

	useEffect(() => {
		if (!timelineRef.current || !epics.length) return

		const groups = new DataSet(
			epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` }))
		)
		const items = new DataSet(
			epics.flatMap(e =>
				(e.workLoads || [])
					.filter(l => l.plannedStartTime && l.plannedStartTime !== "")
					.map(l => ({
						id: l.loadId,
						group: e.epicId,
						type: "range",
						content: getWorkloadContent(l),
						start: new Date(l.plannedStartTime),
						end:
							l.plannedEndTime && l.plannedEndTime !== ""
								? new Date(l.plannedEndTime)
								: addDays(new Date(l.plannedStartTime), 1),
					})
					)
			)
		)

		const tl = new Timeline(timelineRef.current, items, groups, {
			stack: true,
			orientation: "top",
			editable: { updateTime: true, updateGroup: true, remove: true }, // 支援刪除
			locale: "zh-tw",
			zoomMin: 24 * 60 * 60 * 1000,
			zoomMax: 90 * 24 * 60 * 60 * 1000,
		} as TimelineOptions)

		// 處理移動、長度調整、分組變更
		tl.on("change", async (event: TimelineChangeEventProps) => {
			for (const itemId of event.items) {
				const itemData = event.data[itemId]
				if (!itemData) continue

				const epicId = itemData.group
				const epic = epics.find(e => e.epicId === epicId)
				if (!epic) continue

				const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
				if (wlIdx === -1) continue

				// 檢查是否換分組
				const currentEpicId = epics.find(e =>
					(e.workLoads || []).some(wl => wl.loadId === itemId)
				)?.epicId

				if (currentEpicId && currentEpicId !== epicId) {
					// 1. 從舊epic移除
					const oldEpic = epics.find(e => e.epicId === currentEpicId)
					if (oldEpic) {
						const updatedOldWorkLoads = (oldEpic.workLoads || []).filter(wl => wl.loadId !== itemId)
						await updateDoc(doc(firestore, "workEpic", currentEpicId), { workLoads: updatedOldWorkLoads })
					}
					// 2. 加到新epic底下
					const newWorkLoad: WorkLoadEntity = {
						...((epic.workLoads || [])[wlIdx]),
						plannedStartTime: itemData.start.toISOString(),
						plannedEndTime: itemData.end ? itemData.end.toISOString() : "",
					}
					const updatedNewWorkLoads = [...(epic.workLoads || []), newWorkLoad]
					await updateDoc(doc(firestore, "workEpic", epicId), { workLoads: updatedNewWorkLoads })
				} else {
					// 沒換分組，只是修改時間
					const newWorkLoads = [...(epic.workLoads || [])]
					newWorkLoads[wlIdx] = {
						...newWorkLoads[wlIdx],
						plannedStartTime: itemData.start.toISOString(),
						plannedEndTime: itemData.end ? itemData.end.toISOString() : "",
					}
					await updateDoc(doc(firestore, "workEpic", epicId), { workLoads: newWorkLoads })
				}
			}
		})

		// 支援刪除（回到未排班）
		tl.on("remove", async function (event: { items: string[] }) {
			for (const itemId of event.items) {
				// 找到這個 item 是哪個 epic 下的哪個 workload
				const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
				if (!epic) continue
				const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
				if (wlIdx === -1) continue

				const newWorkLoads = [...(epic.workLoads || [])]
				const updateWL = { ...newWorkLoads[wlIdx], plannedStartTime: "", plannedEndTime: "" }
				newWorkLoads[wlIdx] = updateWL
				await updateDoc(doc(firestore, "workEpic", epic.epicId), { workLoads: newWorkLoads })
			}
		})

		return () => {
			tl.destroy()
		}
	}, [epics])

	return (
		<div className="min-h-screen w-full bg-black flex flex-col">
			<div className="flex-none h-[20vh]" />
			<div className="flex-none h-[60vh] w-full flex items-center justify-center">
				{epicLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
						<div className="text-white">資料載入中...</div>
					</div>
				)}
				<div
					className="w-full h-full rounded-2xl bg-white border border-gray-300 shadow overflow-hidden"
					ref={timelineRef}
					style={{ minWidth: '100vw' }}
				/>
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

export default WorkScheduleAdminPage