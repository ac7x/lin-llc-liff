// hooks/useTimeline.ts
import { useEffect, useRef } from 'react'
import { DataGroup, DataItem, DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone'
import { registerTimelineEvents, TimelineEventHandlers } from '../utils/timelineEvents'
import { defaultTimelineOptions } from '../utils/timelineOptions'

export function useTimeline(
    items: DataItem[] | DataSet<DataItem>,
    groups: DataGroup[] | DataSet<DataGroup>,
    handlers: TimelineEventHandlers = {},
    options?: TimelineOptions
) {
    const containerRef = useRef<HTMLDivElement>(null)
    const timelineRef = useRef<Timeline | null>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const timeline = new Timeline(
            containerRef.current,
            items,
            groups,
            { ...defaultTimelineOptions, ...options }
        )
        timelineRef.current = timeline
        registerTimelineEvents(timeline, handlers)
        return () => timeline.destroy()
    }, [items, groups, options, handlers])

    return { containerRef, timelineRef }
}