import { useEffect } from 'react'
import { UseTimelineListenersProps } from './types'
import { redisCache } from './database/redis.client'

/**
 * 事件對應表
 */
const EVENT_PROP_MAP = [
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
    { event: 'destroy', prop: 'onDestroy' },
] as const

/**
 * 綁定與移除 Timeline 事件監聽器
 * @param props UseTimelineListenersProps
 */
export const useTimelineListeners = (props: UseTimelineListenersProps): void => {
    const { timeline } = props

    useEffect(() => {
        if (!timeline) return

        EVENT_PROP_MAP.forEach(({ event, prop }) => {
            const handler = props[prop as keyof UseTimelineListenersProps]
            if (handler) {
                timeline.on(event, handler as (...args: unknown[]) => void)
            }
        })

        return () => {
            EVENT_PROP_MAP.forEach(({ event, prop }) => {
                const handler = props[prop as keyof UseTimelineListenersProps]
                if (handler) {
                    timeline.off(event, handler as (...args: unknown[]) => void)
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeline, ...EVENT_PROP_MAP.map(({ prop }) => props[prop as keyof UseTimelineListenersProps])])
}
