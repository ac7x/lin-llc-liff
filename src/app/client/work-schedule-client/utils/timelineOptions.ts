// utils/timelineOptions.ts
import { TimelineOptions } from 'vis-timeline/standalone'

export const defaultTimelineOptions: TimelineOptions = {
    stack: true,
    orientation: 'top',
    editable: {
        add: true,
        remove: false,
        updateGroup: true,
        updateTime: true,
        overrideItems: false,
    },
    dataAttributes: 'all', // 或明確 array
    locale: 'zh-tw',
    selectable: true,
    multiselect: true,
    zoomMin: 24 * 60 * 60 * 1000,
    zoomMax: 90 * 24 * 60 * 60 * 1000,
    tooltip: { followMouse: true },
    margin: { item: 10, axis: 5 },
    // 你可以把所有 https://visjs.github.io/vis-timeline/docs/timeline/#Options Option 都補齊
}

// 若有多種預設，可 export 多組
// export const readOnlyTimelineOptions = { ...defaultTimelineOptions, editable: false }