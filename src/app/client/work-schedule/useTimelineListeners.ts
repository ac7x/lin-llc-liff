import { useEffect } from 'react'
import { Timeline, TimelineItem } from 'vis-timeline/standalone'

/**
 * 新增事件參數型別
 */
export interface AddEventProps {
    item: TimelineItem
    callback: (item: TimelineItem | null) => void
}

/**
 * 移動事件參數型別
 */
export interface MoveEventProps {
    item: string // TimelineItem id
    start: Date
    end?: Date
    group?: string
    event?: Event
}

/**
 * Timeline 事件處理函式型別
 */
export type TimelineEventHandler<T = unknown> = (props: T) => void

/**
 * useTimelineListeners 的 props
 */
export interface UseTimelineListenersProps {
    timeline: Timeline | null
    onSelect?: TimelineEventHandler<any>
    onDeselect?: TimelineEventHandler<any>
    onItemOver?: TimelineEventHandler<any>
    onItemOut?: TimelineEventHandler<any>
    onItemSelected?: TimelineEventHandler<any>
    onItemUnselected?: TimelineEventHandler<any>
    onRangeChange?: TimelineEventHandler<any>
    onRangeChanged?: TimelineEventHandler<any>
    onClick?: TimelineEventHandler<any>
    onDoubleClick?: TimelineEventHandler<any>
    onContextMenu?: TimelineEventHandler<any>
    onBackgroundClick?: TimelineEventHandler<any>
    onBackgroundDoubleClick?: TimelineEventHandler<any>
    onBackgroundContextMenu?: TimelineEventHandler<any>
    onDrop?: TimelineEventHandler<any>
    onAdd?: TimelineEventHandler<AddEventProps>
    onMove?: TimelineEventHandler<MoveEventProps>
    onRemove?: TimelineEventHandler<any>
    onItemUpdate?: TimelineEventHandler<any>
    onStartResizing?: TimelineEventHandler<any>
    onEndResizing?: TimelineEventHandler<any>
    onChanged?: TimelineEventHandler<any>
    onMouseOver?: TimelineEventHandler<any>
    onMouseDown?: TimelineEventHandler<any>
    onMouseUp?: TimelineEventHandler<any>
    onMouseMove?: TimelineEventHandler<any>
    onMouseOut?: TimelineEventHandler<any>
    onGroupDragged?: TimelineEventHandler<any>
    onGroupDraggedEnd?: TimelineEventHandler<any>
    onMarkerChange?: TimelineEventHandler<any>
    onCurrentTimeTick?: TimelineEventHandler<any>
    onTimeChanged?: TimelineEventHandler<any>
    onDestroy?: TimelineEventHandler<any>
    // ...持續擴充
}

/**
 * 事件對應表
 */
const eventPropMap = [
    { event: 'select', prop: 'onSelect' },
    { event: 'deselect', prop: 'onDeselect' },
    { event: 'itemover', prop: 'onItemOver' },
    { event: 'itemout', prop: 'onItemOut' },
    { event: 'itemselected', prop: 'onItemSelected' },
    { event: 'itemunselected', prop: 'onItemUnselected' },
    { event: 'rangechange', prop: 'onRangeChange' },
    { event: 'rangechanged', prop: 'onRangeChanged' },
    { event: 'click', prop: 'onClick' },
    { event: 'doubleClick', prop: 'onDoubleClick' },
    { event: 'contextmenu', prop: 'onContextMenu' },
    { event: 'backgroundClick', prop: 'onBackgroundClick' },
    { event: 'backgroundDoubleClick', prop: 'onBackgroundDoubleClick' },
    { event: 'backgroundContextMenu', prop: 'onBackgroundContextMenu' },
    { event: 'drop', prop: 'onDrop' },
    { event: 'add', prop: 'onAdd' },
    { event: 'move', prop: 'onMove' },
    { event: 'remove', prop: 'onRemove' },
    { event: 'itemupdate', prop: 'onItemUpdate' },
    { event: 'startResizing', prop: 'onStartResizing' },
    { event: 'endResizing', prop: 'onEndResizing' },
    { event: 'changed', prop: 'onChanged' },
    { event: 'mouseOver', prop: 'onMouseOver' },
    { event: 'mouseDown', prop: 'onMouseDown' },
    { event: 'mouseUp', prop: 'onMouseUp' },
    { event: 'mouseMove', prop: 'onMouseMove' },
    { event: 'mouseOut', prop: 'onMouseOut' },
    { event: 'groupDragged', prop: 'onGroupDragged' },
    { event: 'groupDraggedEnd', prop: 'onGroupDraggedEnd' },
    { event: 'markerChange', prop: 'onMarkerChange' },
    { event: 'currentTimeTick', prop: 'onCurrentTimeTick' },
    { event: 'timechanged', prop: 'onTimeChanged' },
    { event: 'destroy', prop: 'onDestroy' }
] as const

/**
 * 綁定與移除 Timeline 事件監聽器
 * @param props UseTimelineListenersProps
 */
export const useTimelineListeners = (props: UseTimelineListenersProps): void => {
    const { timeline } = props

    useEffect(() => {
        if (!timeline) {
            return
        }

        eventPropMap.forEach(({ event, prop }) => {
            const handler = props[prop as keyof UseTimelineListenersProps]
            if (handler) {
                timeline.on(event, handler as any)
            }
        })

        return () => {
            eventPropMap.forEach(({ event, prop }) => {
                const handler = props[prop as keyof UseTimelineListenersProps]
                if (handler) {
                    timeline.off(event, handler as any)
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeline, ...eventPropMap.map(({ prop }) => props[prop as keyof UseTimelineListenersProps])])
}