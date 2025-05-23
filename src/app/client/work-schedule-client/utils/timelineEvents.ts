// utils/timelineEvents.ts
import { Timeline } from 'vis-timeline/standalone'

/**
 * Properties passed to timeline event handlers.
 * Expand this interface if you need more detail for specific events.
 */
export interface TimelineEventProperties {
    item?: string | number
    group?: string | number
    event?: Event
    time?: Date
    [key: string]: unknown
}

export type TimelineEventHandler = (props: TimelineEventProperties) => void

export type TimelineEventHandlers = {
    onAdd?: TimelineEventHandler
    onMove?: TimelineEventHandler
    onUpdate?: TimelineEventHandler
    onRemove?: TimelineEventHandler
    onSelect?: TimelineEventHandler
    onClick?: TimelineEventHandler
    onDoubleClick?: TimelineEventHandler
    onContextMenu?: TimelineEventHandler
    onItemOver?: TimelineEventHandler
    onItemOut?: TimelineEventHandler
    onRangeChange?: TimelineEventHandler
    onRangeChanged?: TimelineEventHandler
    onTimeChange?: TimelineEventHandler
    onTimeChanged?: TimelineEventHandler
    // ...如有其他事件，依官方 docs 補齊
}

/**
 * Register timeline events with the given handlers.
 * @param timeline Timeline instance
 * @param handlers Handlers mapping
 */
export const registerTimelineEvents = (
    timeline: Timeline,
    handlers: TimelineEventHandlers
): void => {
    if (handlers.onAdd) timeline.on('add', handlers.onAdd)
    if (handlers.onMove) timeline.on('move', handlers.onMove)
    if (handlers.onUpdate) timeline.on('update', handlers.onUpdate)
    if (handlers.onRemove) timeline.on('remove', handlers.onRemove)
    if (handlers.onSelect) timeline.on('select', handlers.onSelect)
    if (handlers.onClick) timeline.on('click', handlers.onClick)
    if (handlers.onDoubleClick) timeline.on('doubleClick', handlers.onDoubleClick)
    if (handlers.onContextMenu) timeline.on('contextmenu', handlers.onContextMenu)
    if (handlers.onItemOver) timeline.on('itemover', handlers.onItemOver)
    if (handlers.onItemOut) timeline.on('itemout', handlers.onItemOut)
    if (handlers.onRangeChange) timeline.on('rangechange', handlers.onRangeChange)
    if (handlers.onRangeChanged) timeline.on('rangechanged', handlers.onRangeChanged)
    if (handlers.onTimeChange) timeline.on('timechange', handlers.onTimeChange)
    if (handlers.onTimeChanged) timeline.on('timechanged', handlers.onTimeChanged)
}