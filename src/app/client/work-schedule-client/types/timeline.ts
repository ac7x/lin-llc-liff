// types/timeline.ts
import { TimelineGroup, TimelineItem } from 'vis-timeline/standalone'

export type MyTimelineItem = TimelineItem & {
    // 你自己加的自定義屬性
    customField?: string
}
export type MyTimelineGroup = TimelineGroup & {
    // ...
}