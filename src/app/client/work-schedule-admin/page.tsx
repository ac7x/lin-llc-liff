'use client'

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { useEffect, useRef, useState, useTransition } from 'react'
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { getAllEpics, LooseWorkLoad, unplanWorkLoad, updateWorkLoad, WorkEpicEntity } from './work-schedule-admin.action'

export default function WorkScheduleAdminPage() {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
	const [loading, setLoading] = useState(true)
	const [, startTransition] = useTransition()
	const timelineRef = useRef<HTMLDivElement>(null)

	// 首次載入資料
	useEffect(() => {
		setLoading(true)
		getAllEpics().then(({ epics, unplanned }) => {
			setEpics(epics)
			setUnplanned(unplanned)
			setLoading(false)
		})
	}, [])

	// vis-timeline 初始化與事件
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
						content: `<div><div>${l.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(l.executor) ? l.executor.join(', ') : l.executor || '(無執行者)'}</div></div>`,
						start: new Date(l.plannedStartTime),
						end: l.plannedEndTime && l.plannedEndTime !== '' ? new Date(l.plannedEndTime) : undefined,
					}))
			)
		)

		const tl = new Timeline(timelineRef.current, items, groups, {
			stack: true,
			orientation: 'top',
			editable: { updateTime: true, updateGroup: true, remove: true },
			locale: 'zh-tw',
			zoomMin: 24 * 60 * 60 * 1000,
			zoomMax: 90 * 24 * 60 * 60 * 1000,
		} as TimelineOptions)

		tl.on('change', async (event: any) => {
			for (const itemId of event.items) {
				const itemData = event.data[itemId]
				if (!itemData) continue
				await updateWorkLoad(itemData.group, itemId, itemData.start, itemData.end ?? null)
			}
			// 重新拉資料
			startTransition(() => {
				setLoading(true)
				getAllEpics().then(({ epics, unplanned }) => {
					setEpics(epics)
					setUnplanned(unplanned)
					setLoading(false)
				})
			})
		})

		tl.on('remove', async (event: any) => {
			for (const itemId of event.items) {
				await unplanWorkLoad(itemId)
			}
			startTransition(() => {
				setLoading(true)
				getAllEpics().then(({ epics, unplanned }) => {
					setEpics(epics)
					setUnplanned(unplanned)
					setLoading(false)
				})
			})
		})

		return () => { tl.destroy() }
		// eslint-disable-next-line
	}, [epics.length])

	return (
		<div className="min-h-screen w-full bg-black flex flex-col">
			<div className="flex-none h-[20vh]" />
			<div className="flex-none h-[60vh] w-full flex items-center justify-center">
				{loading && (
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