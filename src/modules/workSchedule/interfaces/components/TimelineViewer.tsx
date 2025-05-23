import React from 'react'
import { VisTimelineGroup, VisTimelineItem } from '../../domain/model/valueObject/visTimelineValueObject'
import { useVisTimeline } from '../hooks/useVisTimeline'

interface TimelineViewerProps {
    items: VisTimelineItem[]
    groups: VisTimelineGroup[]
    options?: any
    listeners?: Partial<Record<string, (...args: any[]) => void>>
    className?: string
    style?: React.CSSProperties
}

/**
 * 顯示 vis-timeline 時間軸元件，支援所有事件監聽器
 */
export const TimelineViewer: React.FC<TimelineViewerProps> = ({
    items,
    groups,
    options,
    listeners,
    className,
    style
}) => {
    const { timelineRef } = useVisTimeline({ items, groups, options, listeners })
    return <div ref={timelineRef} className={className} style={style} />
}
