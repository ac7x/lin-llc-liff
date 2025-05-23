import { useEffect, useRef } from 'react'
import { DataSet, Timeline } from 'vis-timeline/standalone'
import type { VisTimelineGroup, VisTimelineItem } from '../../domain/model/valueObject/visTimelineValueObject'

/**
 * 初始化 vis-timeline 並回傳相關實例與 DOM 參考
 * @param items 項目資料
 * @param groups 群組資料
 * @param options vis-timeline options
 * @param listeners 事件監聽器（key 為事件名稱，value 為 callback）
 */
export const useVisTimeline = ({
    items,
    groups,
    options,
    listeners
}: {
    items: VisTimelineItem[]
    groups: VisTimelineGroup[]
    options?: any
    listeners?: Partial<Record<string, (...args: any[]) => void>>
}) => {
    const timelineRef = useRef<HTMLDivElement>(null)
    const timelineInstance = useRef<Timeline | null>(null)

    useEffect(() => {
        if (!timelineRef.current) return
        const itemsDS = new DataSet(items)
        const groupsDS = new DataSet(groups)
        const tl = new Timeline(timelineRef.current, itemsDS, groupsDS, options)
        timelineInstance.current = tl
        // 註冊所有事件監聽器
        if (listeners) {
            Object.entries(listeners).forEach(([event, handler]) => {
                if (handler) tl.on(event, handler)
            })
        }
        // 支援 onAdd 事件（特殊設置）
        if (listeners?.onAdd) tl.setOptions({ ...options, onAdd: listeners.onAdd })
        return () => {
            if (listeners) {
                Object.entries(listeners).forEach(([event, handler]) => {
                    if (handler) tl.off(event, handler)
                })
            }
            tl.destroy()
        }
    }, [items, groups, options, listeners])

    return { timelineRef, timelineInstance }
}
