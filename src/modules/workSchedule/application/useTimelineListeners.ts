import { useEffect } from 'react'
import { Timeline, DataSet, DataItem, TimelineItem } from 'vis-timeline/standalone'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { TimelineEventCallbacks, LooseWorkLoad } from '../domain/timeline.types'
import { getWorkloadContent } from '../infrastructure/timelineHelpers'

/**
 * Timeline 事件監聽 hook
 */
export const useTimelineListeners = (
	timeline: Timeline | null,
	itemsDataSet: DataSet<DataItem> | null,
	unplanned: LooseWorkLoad[],
	epics: Array<{ epicId: string }>,
	callbacks: TimelineEventCallbacks
) => {
	// 監聽項目移動事件
	useEffect(() => {
		if (!timeline || !itemsDataSet) {
			return
		}

		const handleMove = async ({ item, start, end, group }: any) => {
			const d = itemsDataSet.get(item as string)
			if (!d) {
				return
			}

			const newStart = startOfDay(start)
			const duration = end ? Math.max(1, differenceInCalendarDays(end, start)) : 1
			const newEnd = addDays(newStart, duration)

			try {
				if (callbacks.onItemMoved) {
					const updatedWorkLoad = await callbacks.onItemMoved(
						group || d.group,
						d.id as string,
						newStart.toISOString(),
						newEnd.toISOString()
					)

					if (updatedWorkLoad) {
						itemsDataSet.update({ id: d.id, start: newStart, end: newEnd })
						callbacks.onWorkLoadUpdated?.(updatedWorkLoad)
					}
				}
			} catch (err) {
				console.error('更新工作負載時間失敗:', err)
			}
		}

		timeline.on('move', handleMove)

		return () => {
			timeline.off('move', handleMove)
		}
	}, [timeline, itemsDataSet, callbacks])

	// 監聽項目新增事件
	useEffect(() => {
		if (!timeline) {
			return
		}

		const handleAdd = async (item: any, cb: (result: TimelineItem | null) => void) => {
			try {
				const payload: { id: string } = JSON.parse(item.content as string)
				const wl = unplanned.find(w => w.loadId === payload.id)
				if (!wl) {
					return cb(null)
				}

				const start = item.start ? new Date(item.start) : new Date()
				const end = item.end ? new Date(item.end) : addDays(start, 1)
				const obj: TimelineItem = {
					id: wl.loadId,
					group: item.group || epics[0]?.epicId,
					content: getWorkloadContent(wl),
					start,
					end,
					type: 'range'
				}

				cb(obj)

				if (callbacks.onItemAdded) {
					const updatedWorkLoad = await callbacks.onItemAdded(
						String(obj.group),
						String(wl.loadId),
						start.toISOString(),
						end.toISOString()
					)

					if (updatedWorkLoad) {
						callbacks.onWorkLoadUpdated?.(updatedWorkLoad)
					}
				}
			} catch {
				cb(null)
			}
		}

		// 注意：這個需要在 Timeline 的 options 中設定
		timeline.setOptions({
			onAdd: handleAdd
		})

	}, [timeline, unplanned, epics, callbacks])
}
