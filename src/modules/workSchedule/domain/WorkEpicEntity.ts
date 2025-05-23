/**
 * 工作專案領域實體
 */
export interface WorkEpicEntity {
	epicId: string
	title: string
	startDate: string
	endDate: string
	insuranceStatus?: '無' | '有'
	insuranceDate?: string
	owner: { memberId: string, name: string }
	siteSupervisors?: { memberId: string, name: string }[]
	safetyOfficers?: { memberId: string, name: string }[]
	status: '待開始' | '進行中' | '已完成' | '已取消'
	priority: number
	region: '北部' | '中部' | '南部' | '東部' | '離島'
	address: string
	createdAt: string
	workZones?: unknown[]
	workTypes?: unknown[]
	workFlows?: unknown[]
	workTasks?: unknown[]
	workLoads?: Array<{
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
	}>
}
