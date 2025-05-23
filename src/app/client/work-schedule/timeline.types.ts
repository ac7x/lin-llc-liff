// src/types/timeline.types.ts
import type { Timeline, TimelineItem } from 'vis-timeline/standalone'

/**
 * Timeline 新增事件參數
 */
export interface TimelineAddEventProps {
    /**
     * 新增的 item 內容（未經處理，通常只有 start、end、content 等）
     */
    item: TimelineItem
    /**
     * 回呼，若 callback(null) 則取消本次新增；callback(資料) 則確定新增
     */
    callback: (item: TimelineItem | null) => void
}

/**
 * Timeline 移動事件參數
 */
export interface TimelineMoveEventProps {
    /**
     * 被移動的 item id
     */
    item: string
    /**
     * 新的開始時間
     */
    start: Date
    /**
     * 新的結束時間（可選）
     */
    end?: Date
    /**
     * 移動到的新分組 id（可選）
     */
    group?: string
    /**
     * 原始事件物件（可選）
     */
    event?: Event
    /**
     * 回呼，callback(null) 則取消移動，callback(資料) 則確定移動
     */
    callback?: (item: TimelineItem | null) => void
}

/**
 * Timeline 刪除事件參數
 */
export interface TimelineRemoveEventProps {
    /**
     * 被刪除的 item 內容
     */
    item: TimelineItem
    /**
     * 回呼，callback(null) 則取消刪除，callback(item) 則確定刪除
     */
    callback: (item: TimelineItem | null) => void
}

/**
 * Timeline 更新 item 事件參數
 */
export interface TimelineUpdateEventProps {
    /**
     * 被更新的 item 內容
     */
    item: TimelineItem
    /**
     * 回呼，callback(null) 則取消更新，callback(item) 則確定更新
     */
    callback: (item: TimelineItem | null) => void
}

/**
 * Timeline 選取事件參數
 */
export interface TimelineSelectEventProps {
    /**
     * 選取的 item id 陣列
     */
    items: string[]
    /**
     * 選取的 group id 陣列
     */
    groups: string[]
    /**
     * 原始事件物件
     */
    event?: Event
}

/**
 * Timeline 通用事件回呼型別
 */
export type TimelineEventHandler<T = unknown> = (props: T) => void

/**
 * Timeline 監聽器 Props （for useTimelineListeners or HOC）
 * 只列出常用事件，可自由擴充
 */
export interface UseTimelineListenersProps {
    timeline: Timeline | null
    onAdd?: TimelineEventHandler<TimelineAddEventProps>
    onMove?: TimelineEventHandler<TimelineMoveEventProps>
    onRemove?: TimelineEventHandler<TimelineRemoveEventProps>
    onUpdate?: TimelineEventHandler<TimelineUpdateEventProps>
    onSelect?: TimelineEventHandler<TimelineSelectEventProps>
    // ...其他 vis-timeline 支援事件，依需求擴充
}