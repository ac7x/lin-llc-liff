'use client'

import { useEffect, useRef, useState } from 'react'
import { DataSet, Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { getAllTestEpics, TestWorkEpicEntity } from './work-schedule-admin.action'

const WorkScheduleAdminPage = () => {
	const [epics, setEpics] = useState<TestWorkEpicEntity[]>([])
	const [loading, setLoading] = useState(true)
	const timelineRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setLoading(true)
		getAllTestEpics().then(({ epics }) => {
			setEpics(epics)
			setLoading(false)
		})
	}, [])

	useEffect(() => {
		if (!timelineRef.current || !epics.length) {
			return
		}
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
			editable: false,
			locale: 'zh-tw',
			zoomMin: 24 * 60 * 60 * 1000,
			zoomMax: 90 * 24 * 60 * 60 * 1000
		})
		return () => { timeline.destroy() }
	}, [epics])

	return (
		<div>
			{loading && <div>Loading...</div>}
			<div style={{ marginTop: 24, height: 400 }}>
				<h3>電影屏</h3>
				<div ref={timelineRef} style={{ width: '100%', height: 350, background: '#fff' }} />
			</div>
		</div>
	)
}

export default WorkScheduleAdminPage