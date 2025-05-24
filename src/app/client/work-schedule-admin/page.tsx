'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
	createTestEpic,
	createTestWorkLoad,
	deleteTestWorkLoad,
	getAllTestEpics,
	TestWorkEpicEntity
} from './work-schedule-admin.action'

// ↓↓↓ 加入 timeline 依賴
import { addDays } from 'date-fns'
import { DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
// ↑↑↑

export default function TestWorkScheduleAdminPage() {
	const [epics, setEpics] = useState<TestWorkEpicEntity[]>([])
	const [loading, setLoading] = useState(true)
	const [, startTransition] = useTransition()
	const [epicTitle, setEpicTitle] = useState('')
	const [workEpicId, setWorkEpicId] = useState('')
	const [workTitle, setWorkTitle] = useState('')
	const [workStart, setWorkStart] = useState('')
	const [workEnd, setWorkEnd] = useState('')

	// ↓↓↓ timeline ref
	const timelineRef = useRef<HTMLDivElement>(null)
	// ↑↑↑

	function refresh() {
		setLoading(true)
		getAllTestEpics().then(({ epics }) => {
			setEpics(epics)
			setLoading(false)
		})
	}

	useEffect(() => {
		refresh()
	}, [])

	async function handleCreateEpic() {
		if (!epicTitle.trim()) return
		await createTestEpic(epicTitle.trim())
		setEpicTitle('')
		startTransition(refresh)
	}

	async function handleCreateWork() {
		if (!workEpicId || !workTitle.trim() || !workStart) return
		await createTestWorkLoad(workEpicId, workTitle.trim(), workStart, workEnd)
		setWorkTitle('')
		setWorkStart('')
		setWorkEnd('')
		startTransition(refresh)
	}

	async function handleDeleteWork(loadId: string) {
		await deleteTestWorkLoad(loadId)
		startTransition(refresh)
	}

	// ↓↓↓ 電影屏渲染
	useEffect(() => {
		if (!timelineRef.current || !epics.length) return
		const groups = new DataSet(
			epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` }))
		)
		const items = new DataSet(
			epics.flatMap(e =>
				(e.workLoads || [])
					.filter(l => l.plannedStartTime && l.plannedStartTime !== '')
					.map(l => ({
						id: l.loadId,
						group: e.epicId,
						type: 'range',
						content: `<div>${l.title || '(無標題)'}</div>`,
						start: new Date(l.plannedStartTime),
						end: l.plannedEndTime && l.plannedEndTime !== ''
							? new Date(l.plannedEndTime)
							: addDays(new Date(l.plannedStartTime), 1)
					}))
			)
		)
		const tl = new Timeline(timelineRef.current, items, groups, {
			stack: true,
			orientation: 'top',
			editable: false,
			locale: 'zh-tw',
			zoomMin: 24 * 60 * 60 * 1000,
			zoomMax: 90 * 24 * 60 * 60 * 1000
		})
		return () => { tl.destroy() }
	}, [epics])
	// ↑↑↑

	return (
		<div style={{ padding: 16 }}>
			<div>
				<input
					placeholder="新 Epic 標題"
					value={epicTitle}
					onChange={e => setEpicTitle(e.target.value)}
				/>
				<button onClick={handleCreateEpic}>建立 Epic</button>
			</div>
			<div style={{ marginTop: 12 }}>
				<select value={workEpicId} onChange={e => setWorkEpicId(e.target.value)}>
					<option value="">選擇 Epic</option>
					{epics.map(epic => (
						<option key={epic.epicId} value={epic.epicId}>{epic.title}</option>
					))}
				</select>
				<input
					placeholder="工作名稱"
					value={workTitle}
					onChange={e => setWorkTitle(e.target.value)}
				/>
				<input
					type="datetime-local"
					value={workStart}
					onChange={e => setWorkStart(e.target.value)}
				/>
				<input
					type="datetime-local"
					value={workEnd}
					onChange={e => setWorkEnd(e.target.value)}
				/>
				<button onClick={handleCreateWork}>建立工作</button>
			</div>
			{loading && <div>Loading...</div>}
			<div style={{ marginTop: 24 }}>
				{epics.map(epic => (
					<div key={epic.epicId} style={{ marginBottom: 16, border: '1px solid #ccc', padding: 8 }}>
						<div><b>Epic:</b> {epic.title}</div>
						<ul>
							{(epic.workLoads || []).map(work => (
								<li key={work.loadId}>
									{work.title} | {work.plannedStartTime} ~ {work.plannedEndTime}
									<button style={{ marginLeft: 8 }} onClick={() => handleDeleteWork(work.loadId)}>刪除</button>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			{/* ↓↓↓ 電影屏區塊 */}
			<div style={{ marginTop: 48, height: 400 }}>
				<h3 style={{ marginBottom: 8 }}>電影屏</h3>
				<div ref={timelineRef} style={{ width: '100%', height: 350, background: '#fff', borderRadius: 8 }} />
			</div>
			{/* ↑↑↑ */}
		</div>
	)
}