import { VisTimelineGroup, VisTimelineItem } from '../../domain/model/valueObject/visTimelineValueObject'

/**
 * 產生 vis-timeline 項目與群組的用例
 */
export const generateTimelineData = (epics: any[], workLoads: any[]): {
    items: VisTimelineItem[]
    groups: VisTimelineGroup[]
} => {
    const groups = epics.map(e => new VisTimelineGroup({ id: e.epicId, content: `<b>${e.title}</b>` }))
    const items = workLoads.filter(l => l.plannedStartTime).map(l =>
        new VisTimelineItem({
            id: l.loadId,
            group: l.epicId,
            content: `<div><div>${l.title || '(無標題)'}</div><div style=\"color:#888\">${Array.isArray(l.executor) ? l.executor.join(', ') : l.executor || '(無執行者)'}</div></div>`,
            start: new Date(l.plannedStartTime),
            end: l.plannedEndTime ? new Date(l.plannedEndTime) : undefined
        })
    )
    return { items, groups }
}
