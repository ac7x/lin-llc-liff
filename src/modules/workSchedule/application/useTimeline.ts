import { useRef, useEffect } from 'react'
import { Timeline, DataSet, TimelineOptions, DataGroup, DataItem } from 'vis-timeline/standalone'
import { TimelineConfig } from '../domain/timeline.types'

/**
 * 初始化與管理 vis-timeline 實例的 hook
 */
export const useTimeline = (
	containerRef: React.RefObject<HTMLDivElement | null>,
	items: DataSet<DataItem>,
	groups: DataSet<DataGroup>,
	config: TimelineConfig = {}
) => {
	const timelineRef = useRef<Timeline | null>(null)

	useEffect(() => {
		if (!containerRef.current) {
			return
		}

		const options: TimelineOptions = {
			stack: true,
			orientation: 'top',
			editable: {
				updateTime: true,
				updateGroup: true,
				remove: false,
				add: true,
				...config.editable
			},
			locale: config.locale || 'zh-tw',
			tooltip: { followMouse: true },
			zoomMin: config.zoomMin || 24 * 60 * 60 * 1000,
			zoomMax: config.zoomMax || 90 * 24 * 60 * 60 * 1000
		}

		const timeline = new Timeline(containerRef.current, items, groups, options)
		timelineRef.current = timeline

		const handleResize = () => timeline.redraw()
		window.addEventListener('resize', handleResize)

		return () => {
			timeline.destroy()
			window.removeEventListener('resize', handleResize)
			timelineRef.current = null
		}
	}, [containerRef, items, groups, config])

	return timelineRef.current
}
