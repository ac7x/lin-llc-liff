// src/modules/workSchedule/domain/model/valueObject/TimelineItem.ts

export type TimelineItemType = 'box' | 'point' | 'range' | 'background' | 'custom'

export interface TimelineItemParams {
    id: string | number
    group?: string | number
    content: string
    start: Date
    end?: Date
    type?: TimelineItemType
    className?: string
    title?: string
    editable?: boolean | { updateTime?: boolean; updateGroup?: boolean }
}

export class TimelineItem {
    readonly id: string | number
    readonly group?: string | number
    readonly content: string
    readonly start: Date
    readonly end?: Date
    readonly type: TimelineItemType
    readonly className?: string
    readonly title?: string
    readonly editable?: boolean | { updateTime?: boolean; updateGroup?: boolean }

    constructor(params: TimelineItemParams) {
        this.id = params.id
        this.group = params.group
        this.content = params.content
        this.start = params.start
        this.end = params.end
        this.type = params.type ?? 'box'
        this.className = params.className
        this.title = params.title
        this.editable = params.editable
    }

    // 你可以在此加上領域行為，如日期合法性檢查等
    isValidDateRange(): boolean {
        if (this.end) {
            return this.end >= this.start
        }
        return true
    }
}
