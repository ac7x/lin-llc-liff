// src/modules/workSchedule/domain/model/valueObject/TimelineEvent.ts

export type TimelineEventName =
    | 'click'
    | 'doubleClick'
    | 'select'
    | 'itemover'
    | 'itemout'
    | 'rangechange'
    | 'rangechanged'
    | 'timechange'
    | 'timechanged'
    | 'contextmenu'
    | 'drop'
    | 'dragStart'
    | 'dragging'
    | 'dragEnd'

export interface TimelineEventParams {
    eventName: TimelineEventName
    eventData: any
}

export class TimelineEvent {
    readonly eventName: TimelineEventName
    readonly eventData: any

    constructor(params: TimelineEventParams) {
        this.eventName = params.eventName
        this.eventData = params.eventData
    }
}
