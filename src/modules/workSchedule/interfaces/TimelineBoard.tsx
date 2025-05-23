'use client'

import React, { useRef, useEffect } from 'react'
import { DataSet, DataGroup, DataItem } from 'vis-timeline/standalone'
import { useTimeline } from '../application/useTimeline'
import { useTimelineListeners } from '../application/useTimelineListeners'
import { WorkEpicEntity } from '../domain/WorkEpicEntity'
import { TimelineEventCallbacks, TimelineConfig, LooseWorkLoad, DraggableItem } from '../domain/timeline.types'
import { convertEpicsToGroups, convertWorkLoadsToItems, createDraggableItem } from '../infrastructure/timelineHelpers'
import { addDays, startOfDay } from 'date-fns'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

interface TimelineBoardProps {
	epics: WorkEpicEntity[]
	unplanned: LooseWorkLoad[]
	callbacks: TimelineEventCallbacks
	config?: TimelineConfig
	className?: string
	style?: React.CSSProperties
}

/**
 * 封裝 vis-timeline 的 React 元件
 */
export const TimelineBoard: React.FC<TimelineBoardProps> = ({
	epics,
	unplanned,
	callbacks,
	config = {},
	className = 'w-full h-full rounded-2xl bg-white border border-gray-300 shadow overflow-hidden',
	style = { minWidth: '100vw' }
}) => {
	const timelineRef = useRef<HTMLDivElement>(null)
	const itemsDataSetRef = useRef<DataSet<DataItem> | null>(null)

	// 建立 Timeline 資料
	const groups = new DataSet<DataGroup>(convertEpicsToGroups(epics))
	const items = new DataSet<DataItem>(convertWorkLoadsToItems(epics))
	itemsDataSetRef.current = items

	// 初始化 Timeline
	const timeline = useTimeline(timelineRef, items, groups, config)

	// 設定事件監聽
	useTimelineListeners(timeline, items, unplanned, epics, callbacks)

	// 設定拖放事件
	useEffect(() => {
		const ref = timelineRef.current
		if (!ref || !timeline || !itemsDataSetRef.current) {
			return
		}

		const handleDragOver = (e: DragEvent) => e.preventDefault()

		const handleDrop = (e: DragEvent) => {
			e.preventDefault()
			try {
				const payload: DraggableItem = JSON.parse(e.dataTransfer?.getData('text') || '{}')
				const point = timeline.getEventProperties(e)
				if (!point.time) {
					return
				}

				const wl = unplanned.find(w => w.loadId === payload.id)
				if (!wl) {
					return
				}

				const groupId = payload.group || epics[0]?.epicId
				const startTime = startOfDay(point.time)
				const endTime = addDays(startTime, 1)

				if (callbacks.onItemAdded) {
					callbacks.onItemAdded(
						groupId,
						wl.loadId,
						startTime.toISOString(),
						endTime.toISOString()
					).then(updatedWorkLoad => {
						if (updatedWorkLoad) {
							itemsDataSetRef.current?.add({
								id: wl.loadId,
								group: groupId,
								content: `<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`,
								start: startTime,
								end: endTime,
								type: 'range'
							})
							callbacks.onWorkLoadUpdated?.(updatedWorkLoad)
						}
					})
				}
			} catch {
				// 忽略錯誤
			}
		}

		ref.addEventListener('dragover', handleDragOver)
		ref.addEventListener('drop', handleDrop)

		return () => {
			ref.removeEventListener('dragover', handleDragOver)
			ref.removeEventListener('drop', handleDrop)
		}
	}, [timeline, unplanned, epics, callbacks])

	return <div ref={timelineRef} className={className} style={style} />
}

/**
 * 未排班工作項目元件
 */
interface UnplannedWorkItemProps {
	workLoad: LooseWorkLoad
	onDragStartAction: (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => void
}

export const UnplannedWorkItem: React.FC<UnplannedWorkItemProps> = ({
	workLoad,
	onDragStartAction
}) => (
	<div
		className="cursor-move bg-yellow-50 border rounded px-3 py-2 text-sm hover:bg-yellow-100 flex items-center"
		draggable
		onDragStart={e => onDragStartAction(e, workLoad)}
		title={`來自 ${workLoad.epicTitle}`}
	>
		<span className="mr-2 select-none">≣</span>
		<div>
			<div>{workLoad.title || '(無標題)'}</div>
			<div className="text-xs text-gray-400">
				{Array.isArray(workLoad.executor) ? workLoad.executor.join(', ') : workLoad.executor || '(無執行者)'}
			</div>
		</div>
	</div>
)

/**
 * 處理拖拽開始事件的工具函式
 */
export const handleDragStartAction = (e: React.DragEvent<HTMLDivElement>, wl: LooseWorkLoad) => {
	e.dataTransfer.effectAllowed = 'move'
	e.dataTransfer.setData('text/plain', createDraggableItem(wl))
}
