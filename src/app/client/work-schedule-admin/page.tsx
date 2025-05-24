// src/app/client/work-schedule-admin/page.tsx

'use client'

import { useEffect, useState, useTransition } from 'react'
import {
	createTestEpic,
	createTestWorkLoad,
	deleteTestWorkLoad,
	getAllTestEpics,
	TestWorkEpicEntity
} from './work-schedule-admin.action'

export default function TestWorkScheduleAdminPage() {
	const [epics, setEpics] = useState<TestWorkEpicEntity[]>([])
	const [loading, setLoading] = useState(true)
	const [, startTransition] = useTransition()
	const [epicTitle, setEpicTitle] = useState('')
	const [workEpicId, setWorkEpicId] = useState('')
	const [workTitle, setWorkTitle] = useState('')
	const [workStart, setWorkStart] = useState('')
	const [workEnd, setWorkEnd] = useState('')

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
		</div>
	)
}