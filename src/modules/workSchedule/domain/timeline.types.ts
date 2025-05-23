import { WorkLoadEntity } from './WorkLoadEntity'

/**
 * Timeline 相關型別定義
 */

/**
 * 擴展的工作負載型別，包含專案資訊
 */
export type LooseWorkLoad = WorkLoadEntity & { 
	epicId: string
	epicTitle: string 
}

/**
 * 可拖拽項目型別
 */
export interface DraggableItem {
	id: string
	type: 'range'
	content: string
	group: string
	start: Date
	end: Date
}

/**
 * Timeline 事件回調型別
 */
export interface TimelineEventCallbacks {
	onItemMoved?: (epicId: string, loadId: string, startTime: string, endTime: string) => Promise<WorkLoadEntity | null>
	onItemAdded?: (epicId: string, loadId: string, startTime: string, endTime: string) => Promise<WorkLoadEntity | null>
	onWorkLoadUpdated?: (workLoad: WorkLoadEntity) => void
}

/**
 * Timeline 配置選項
 */
export interface TimelineConfig {
	locale?: string
	zoomMin?: number
	zoomMax?: number
	editable?: {
		updateTime?: boolean
		updateGroup?: boolean
		remove?: boolean
		add?: boolean
	}
}
