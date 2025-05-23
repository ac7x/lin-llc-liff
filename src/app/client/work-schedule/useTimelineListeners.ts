import { useEffect } from 'react'
import { Timeline } from 'vis-timeline/standalone'

interface UseTimelineListenersProps {
    timeline: Timeline | null
    onSelect?: (props: any) => void
    onItemOver?: (props: any) => void
    onItemOut?: (props: any) => void
    onRangeChange?: (props: any) => void
    onRangeChanged?: (props: any) => void
    onClick?: (props: any) => void
    onDoubleClick?: (props: any) => void
    onContextMenu?: (props: any) => void
    onDrop?: (props: any) => void
    onAdd?: (props: any) => void
    onMove?: (props: any) => void
    onRemove?: (props: any) => void
    onStartResizing?: (props: any) => void
    onEndResizing?: (props: any) => void
    // ...可以持續擴充
}

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