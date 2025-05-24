"use client"

import { getAllWorkLoads } from "@/app/actions/workload.action"
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { useEffect, useRef, useState } from "react"
import { DataSet, Timeline, TimelineOptions } from "vis-timeline/standalone"
import "vis-timeline/styles/vis-timeline-graph2d.min.css"
import { addWorkEpic, addWorkLoadToEpic, getAllWorkEpics } from "./work-schedule-admin.action"

// 型別定義
type Group = {
	id: string
	content: string
}

type Item = {
	id: string
	group: string
	title: string
	start: string
	end: string
	content: string
}

type Epic = {
	epicId: string
	title: string
}

type Load = {
	loadId: string
	epicIds?: string[]
	title: string
	plannedStartTime: string
	plannedEndTime: string
}

export default function WorkScheduleAdminPage() {
	const timelineRef = useRef<HTMLDivElement>(null)
	const [groups, setGroups] = useState<Group[]>([])
	const [items, setItems] = useState<Item[]>([])
	const [newGroupTitle, setNewGroupTitle] = useState("")
	const [newItem, setNewItem] = useState<{ title: string; group: string; start: string; end: string }>({
		title: "",
		group: "",
		start: "",
		end: "",
	})

	// 載入 Firestore groups/items
	useEffect(() => {
		Promise.all([getAllWorkEpics(false), getAllWorkLoads()]).then(([epics, loads]) => {
			setGroups(
				(epics as Epic[]).map((e) => ({
					id: e.epicId,
					content: e.title,
				}))
			)
			setItems(
				(loads as Load[]).map((l) => ({
					id: l.loadId,
					group: l.epicIds?.[0] || "",
					title: l.title,
					start: l.plannedStartTime,
					end: l.plannedEndTime,
					content: l.title,
				}))
			)
		})
	}, [])

	// 初始化 vis-timeline
	useEffect(() => {
		if (!timelineRef.current) return
		const dsGroups = new DataSet(groups)
		const dsItems = new DataSet(items)
		const tl = new Timeline(timelineRef.current, dsItems, dsGroups, {
			stack: true,
			orientation: "top",
			editable: false,
			locale: "zh-tw",
		} as TimelineOptions)
		return () => {
			tl.destroy()
		}
	}, [groups, items])

	// 建立 group
	const handleAddGroup = async () => {
		if (!newGroupTitle) return
		const epicId = `epic_${Date.now()}`
		await addWorkEpic({
			epicId,
			title: newGroupTitle,
			startDate: "",
			endDate: "",
			owner: { memberId: "", name: "" },
			status: "待開始",
			priority: 1,
			region: "北部",
			address: "",
			createdAt: new Date().toISOString(),
		})
		setGroups((g) => [...g, { id: epicId, content: newGroupTitle }])
		setNewGroupTitle("")
	}

	// 建立 item
	const handleAddItem = async () => {
		if (!newItem.title || !newItem.group || !newItem.start) return
		const loadId = `load_${Date.now()}`
		const newLoad = {
			loadId,
			title: newItem.title,
			plannedStartTime: newItem.start,
			plannedEndTime: newItem.end,
			epicIds: [newItem.group],
			taskId: "",
			plannedQuantity: 1,
			unit: "",
			actualQuantity: 0,
			executor: [],
			notes: "",
		}
		await addWorkLoadToEpic(newItem.group, newLoad)
		setItems((i) => [
			...i,
			{
				id: loadId,
				group: newItem.group,
				title: newItem.title,
				start: newItem.start,
				end: newItem.end,
				content: newItem.title,
			},
		])
		setNewItem({ title: "", group: "", start: "", end: "" })
	}

	return (
		<div className="p-4 pb-24">
			<h1 className="text-2xl font-bold mb-4">時程管理（管理員）</h1>
			<div className="mb-4">
				<h2 className="font-semibold mb-2">建立 group（標的）</h2>
				<input
					value={newGroupTitle}
					onChange={(e) => setNewGroupTitle(e.target.value)}
					placeholder="group 標題"
					className="border p-1 mr-2"
				/>
				<button onClick={handleAddGroup} className="bg-blue-500 text-white px-3 py-1 rounded">
					建立
				</button>
			</div>
			<div className="mb-4">
				<h2 className="font-semibold mb-2">建立 item（工作負載）</h2>
				<input
					value={newItem.title}
					onChange={(e) => setNewItem((v) => ({ ...v, title: e.target.value }))}
					placeholder="item 標題"
					className="border p-1 mr-2"
				/>
				<select
					value={newItem.group}
					onChange={(e) => setNewItem((v) => ({ ...v, group: e.target.value }))}
					className="border p-1 mr-2"
				>
					<option value="">選擇 group</option>
					{groups.map((g) => (
						<option key={g.id} value={g.id}>
							{g.content}
						</option>
					))}
				</select>
				<input
					type="datetime-local"
					value={newItem.start}
					onChange={(e) => setNewItem((v) => ({ ...v, start: e.target.value }))}
					className="border p-1 mr-2"
				/>
				<input
					type="datetime-local"
					value={newItem.end}
					onChange={(e) => setNewItem((v) => ({ ...v, end: e.target.value }))}
					className="border p-1 mr-2"
				/>
				<button onClick={handleAddItem} className="bg-green-500 text-white px-3 py-1 rounded">
					建立
				</button>
			</div>
			<div className="my-8">
				<div ref={timelineRef} style={{ width: "100%", height: 500, background: "#fff", borderRadius: 8 }} />
			</div>
			<ClientBottomNav />
		</div>
	)
}