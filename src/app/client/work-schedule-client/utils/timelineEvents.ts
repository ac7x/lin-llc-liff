// utils/timelineEvents.ts
import { Timeline } from 'vis-timeline/standalone'

export type TimelineEventHandlers = {
    onAdd?: (...args: any[]) => void
    onMove?: (...args: any[]) => void
    onUpdate?: (...args: any[]) => void
    onRemove?: (...args: any[]) => void
    onSelect?: (...args: any[]) => void
    onClick?: (...args: any[]) => void
    onDoubleClick?: (...args: any[]) => void
    onContextMenu?: (...args: any[]) => void
    onItemOver?: (...args: any[]) => void
    onItemOut?: (...args: any[]) => void
    onRangeChange?: (...args: any[]) => void
    onRangeChanged?: (...args: any[]) => void
    onTimeChange?: (...args: any[]) => void
    onTimeChanged?: (...args: any[]) => void
    // ...如有其他事件，依官方 docs 補齊
}

export function registerTimelineEvents(
    timeline: Timeline,
    handlers: TimelineEventHandlers
) {
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