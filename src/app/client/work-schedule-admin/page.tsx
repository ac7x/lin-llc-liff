'use client'

import { useEffect, useRef, useState } from 'react'
import { DataSet } from 'vis-data/peer'
import { Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import { getAllTestEpics, TestWorkEpicEntity } from './work-schedule-admin.action'

type TimelineEventProps = Record<string, unknown>

const eventHandlers: Record<
	| 'add'
	| 'update'
	| 'remove'
	| 'change'
	| 'select'
	| 'deselect'
	| 'click'
	| 'doubleClick'
	| 'contextmenu'
	| 'rangechange'
	| 'rangechanged'
	| 'dragStart'
	| 'dragEnd'
	| 'move',
	(props: TimelineEventProps) => void
> = {
	add: (props) => { console.log('add', props) },
	update: (props) => { console.log('update', props) },
	remove: (props) => { console.log('remove', props) },
	change: (props) => { console.log('change', props) },
	select: (props) => { console.log('select', props) },
	deselect: (props) => { console.log('deselect', props) },
	click: (props) => { console.log('click', props) },
	doubleClick: (props) => { console.log('doubleClick', props) },
	contextmenu: (props) => { console.log('contextmenu', props) },
	rangechange: (props) => { console.log('rangechange', props) },
	rangechanged: (props) => { console.log('rangechanged', props) },
	dragStart: (props) => { console.log('dragStart', props) },
	dragEnd: (props) => { console.log('dragEnd', props) },
	move: (props) => { console.log('move', props) }
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
			editable: true, // 必須為 true 才能觸發 add/update/remove/drag 事件
			locale: 'zh-tw',
			zoomMin: 24 * 60 * 60 * 1000,
			zoomMax: 90 * 24 * 60 * 60 * 1000
		})

		Object.entries(eventHandlers).forEach(([event, handler]) => {
			timeline.on(event, handler)
		})

		timelineInstance.current = timeline
		return () => { timeline.destroy() }
	}, [epics])

	return (
		<div>
			{loading && <div>Loading...</div>}
			<h3>電影屏</h3>
			<div ref={timelineRef} style={{ width: '100vw', height: 350, background: '#fff', margin: 0, padding: 0 }} />
			<ClientBottomNav />
		</div>
	)
}

export default WorkScheduleAdminPage