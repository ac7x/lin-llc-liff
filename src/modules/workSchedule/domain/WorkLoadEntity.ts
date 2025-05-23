/**
 * 工作負載領域實體
 */
export interface WorkLoadEntity {
	loadId: string
	taskId: string
	plannedQuantity: number
	unit: string
	plannedStartTime: string
	plannedEndTime: string
	actualQuantity: number
	executor: string[]
	title: string
	notes?: string
	epicIds: string[]
}
