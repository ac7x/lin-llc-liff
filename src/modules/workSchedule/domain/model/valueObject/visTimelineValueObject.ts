/**
 * vis-timeline 專用值物件，代表一個時間軸項目
 */
export class VisTimelineItem {
    /**
     * 項目唯一識別碼
     */
    readonly id: string
    /**
     * 所屬群組 ID
     */
    readonly group: string
    /**
     * 顯示內容（HTML 字串）
     */
    readonly content: string
    /**
     * 起始時間
     */
    readonly start: Date
    /**
     * 結束時間（可選）
     */
    readonly end?: Date
    /**
     * 項目型態，預設 'range'
     */
    readonly type: 'range' = 'range'

    constructor(params: {
        id: string
        group: string
        content: string
        start: Date
        end?: Date
    }) {
        this.id = params.id
        this.group = params.group
        this.content = params.content
        this.start = params.start
        this.end = params.end
    }
}

/**
 * vis-timeline 專用值物件，代表一個群組
 */
export class VisTimelineGroup {
    /**
     * 群組唯一識別碼
     */
    readonly id: string
    /**
     * 顯示內容（HTML 字串）
     */
    readonly content: string

    constructor(params: { id: string; content: string }) {
        this.id = params.id
        this.content = params.content
    }
}
