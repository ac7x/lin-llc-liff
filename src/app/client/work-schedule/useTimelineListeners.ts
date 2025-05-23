import { useEffect } from 'react'
import { Timeline, TimelineItem } from 'vis-timeline/standalone'

export interface AddEventProps {
    item: TimelineItem
    callback: (item: TimelineItem | null) => void
}

export interface MoveEventProps {
    item: string // TimelineItem id
    start: Date
    end?: Date
    group?: string
    event?: Event
}

export type TimelineEventHandler<T = unknown> = (props: T) => void

export interface UseTimelineListenersProps {
    timeline: Timeline | null
    onSelect?: TimelineEventHandler
    onItemOver?: TimelineEventHandler
    onItemOut?: TimelineEventHandler
    onRangeChange?: TimelineEventHandler
    onRangeChanged?: TimelineEventHandler
    onClick?: TimelineEventHandler
    onDoubleClick?: TimelineEventHandler
    onContextMenu?: TimelineEventHandler
    onDrop?: TimelineEventHandler
    onAdd?: TimelineEventHandler<AddEventProps>
    onMove?: TimelineEventHandler<MoveEventProps>
    onRemove?: TimelineEventHandler
    onStartResizing?: TimelineEventHandler
    onEndResizing?: TimelineEventHandler
    // ...持續擴充
}

export const useTimelineListeners = (props: UseTimelineListenersProps): void => {
    const { timeline, ...listeners } = props

    useEffect(() => {
        if (!timeline) return

        Object.entries(listeners).forEach(([event, handler]) => {
            if (handler) {
                timeline.on(event.replace(/^on/, '').toLowerCase(), handler)
            }
        })

        return () => {
            Object.entries(listeners).forEach(([event, handler]) => {
                if (handler) {
                    timeline.off(event.replace(/^on/, '').toLowerCase(), handler)
                }
            })
        }
    }, [timeline, listeners])
}