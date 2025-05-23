import { WorkLoadEntity } from '../domain/WorkLoadEntity'
import { LooseWorkLoad } from '../domain/timeline.types'
import { DataGroup, DataItem } from 'vis-timeline/standalone'

/**
 * 產生工作負載的顯示內容
 */
export const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>): string =>
	`<div><div>${wl.title || '(無標題)'}</div><div style="color:#888">${Array.isArray(wl.executor) ? wl.executor.join(', ') : wl.executor || '(無執行者)'}</div></div>`

/**
 * 將專案清單轉換為 Timeline 群組資料
 */
export const convertEpicsToGroups = (epics: Array<{ epicId: string, title: string }>): DataGroup[] =>
	epics.map(e => ({ id: e.epicId, content: `<b>${e.title}</b>` }))

/**
 * 將工作負載轉換為 Timeline 項目資料
 */
export const convertWorkLoadsToItems = (epics: Array<{ epicId: string, workLoads?: WorkLoadEntity[] }>): DataItem[] =>
	epics.flatMap(e =>
		(e.workLoads || [])
			.filter(l => l.plannedStartTime)
			.map(l => ({
				id: l.loadId,
				group: e.epicId,
				type: 'range' as const,
				content: getWorkloadContent(l),
				start: new Date(l.plannedStartTime),
				end: l.plannedEndTime ? new Date(l.plannedEndTime) : undefined
			}))
	)

/**
 * 從專案清單中提取未排班工作
 */
export const extractUnplannedWorkLoads = (epics: Array<{ epicId: string, title: string, workLoads?: WorkLoadEntity[] }>): LooseWorkLoad[] =>
	epics.flatMap(e =>
		(e.workLoads || [])
			.filter(l => !l.plannedStartTime)
			.map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
	)

/**
 * 建立拖拽項目資料
 */
export const createDraggableItem = (wl: LooseWorkLoad): string => {
	const dragItem = {
		id: wl.loadId,
		type: 'range',
		content: getWorkloadContent(wl),
		group: wl.epicId,
		start: new Date(),
		end: new Date(Date.now() + 24 * 60 * 60 * 1000) // 預設 1 天
	}
	return JSON.stringify(dragItem)
}
