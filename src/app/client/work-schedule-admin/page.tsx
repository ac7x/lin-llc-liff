'use client'

import { useEffect, useRef, useState } from 'react'
import { DataSet } from 'vis-data/peer'
import { Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { getAllTestEpics, TestWorkEpicEntity } from './work-schedule-admin.action'

const eventHandlers = {
	// 操作事件
	add: (props: any) => { console.log('add', props) },
	update: (props: any) => { console.log('update', props) },
	remove: (props: any) => { console.log('remove', props) },
	change: (props: any) => { console.log('change', props) },
	// 使用者互動
	select: (props: any) => { console.log('select', props) },
	deselect: (props: any) => { console.log('deselect', props) },
	click: (props: any) => { console.log('click', props) },
	doubleClick: (props: any) => { console.log('doubleClick', props) },
	contextmenu: (props: any) => { console.log('contextmenu', props) },
	// 時間軸範圍
	rangechange: (props: any) => { console.log('rangechange', props) },
	rangechanged: (props: any) => { console.log('rangechanged', props) },
	// 拖曳
	dragStart: (props: any) => { console.log('dragStart', props) },
	dragEnd: (props: any) => { console.log('dragEnd', props) },
	move: (props: any) => { console.log('move', props) }
}

const WorkScheduleAdminPage = () => {
	const [epics, setEpics] = useState<TestWorkEpicEntity[]>([])
	const [loading, setLoading] = useState(true)
	const timelineRef = useRef<HTMLDivElement>(null)
	const timelineInstance = useRef<Timeline | null>(null)

	useEffect(() => {
		setLoading(true)
		getAllTestEpics().then(({ epics }) => {
			setEpics(epics)
			setLoading(false)
		})
	}, [])

	useEffect(() => {
		if (!timelineRef.current || !epics.length) return

		const groups = new DataSet(
			epics.map(epic => ({
				id: epic.epicId,
				content: `<b>${epic.title}</b>`
			}))
		)
		const items = new DataSet(
			epics.flatMap(epic =>
				(epic.workLoads || [])
					.filter(work => work.plannedStartTime)
					.map(work => ({
						id: work.loadId,
						group: epic.epicId,
						type: 'range',
						content: `<div>${work.title || '(無標題)'}</div>`,
						start: new Date(work.plannedStartTime),
						end: work.plannedEndTime
							? new Date(work.plannedEndTime)
							: new Date(new Date(work.plannedStartTime).getTime() + 24 * 60 * 60 * 1000)
					}))
			)
		)

		const timeline = new Timeline(timelineRef.current, items, groups, {
			stack: true,
			orientation: 'top',
			editable: true, // 改 true：才能觸發 add/update/remove/drag 事件
			locale: 'zh-tw',
			zoomMin: 24 * 60 * 60 * 1000,
			zoomMax: 90 * 24 * 60 * 60 * 1000
		})

		// 一行註冊所有事件
		Object.entries(eventHandlers).forEach(([event, handler]) => {
			timeline.on(event, handler)
		})

		timelineInstance.current = timeline
		return () => { timeline.destroy() }
	}, [epics])

	return (
		<div style={{ minHeight: '100vh', width: '100vw', overflowX: 'auto' }}>
			{loading && <div>Loading...</div>}
			<div style={{ height: 600, width: '100%' }}>
				<h3>電影屏</h3>
				<div ref={timelineRef} style={{ width: '100%', height: 350, background: '#fff' }} />
			</div>
			<ClientBottomNav />
		</div>
	)
}

export default WorkScheduleAdminPage