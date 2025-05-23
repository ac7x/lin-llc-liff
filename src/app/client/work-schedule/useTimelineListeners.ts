import { useEffect } from 'react'
import { Timeline } from 'vis-timeline/standalone'

/**
 * Timeline event handler props
 */
export type TimelineEventHandler<T = unknown> = (props: T) => void

/**
 * Props for useTimelineListeners
 */
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
    onAdd?: TimelineEventHandler
    onMove?: TimelineEventHandler
    onRemove?: TimelineEventHandler
    onStartResizing?: TimelineEventHandler
    onEndResizing?: TimelineEventHandler
    // ...可以持續擴充
}

/**
 * Hook: 自動註冊/移除 Timeline 事件監聽
 */
export const useTimelineListeners = (props: UseTimelineListenersProps): void => {
    const { timeline, ...listeners } = props

    useEffect(() => {
        if (!timeline) {
            return
        }

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