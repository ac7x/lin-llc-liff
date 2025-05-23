import { WorkItem, WorkItemStatus, WorkItemType, WorkItemVO } from '../model/WorkItem';
import { WorkItemRepository } from '../repository/WorkItemRepo';

/**
 * 排程服務 - 核心商業邏輯
 * 處理工作排程的業務規則和邏輯
 */
export class ScheduleService {
    constructor(private readonly workItemRepository: WorkItemRepository) { }

    /**
     * 建立新的工作項目
     */
    async createWorkItem(workItemData: Omit<WorkItemVO, 'id'>): Promise<WorkItem> {
        const id = this.generateWorkItemId();
        const workItem = new WorkItemVO(
            id,
            workItemData.title,
            workItemData.startTime,
            workItemData.endTime,
            workItemData.type,
            workItemData.status,
            workItemData.priority,
            workItemData.description,
            workItemData.assigneeId,
            workItemData.assigneeName,
            workItemData.tags,
            workItemData.metadata
        );

        // 檢查時間衝突
        await this.validateNoTimeConflicts(workItem);

        return await this.workItemRepository.save(workItem);
    }

    /**
     * 更新工作項目時間
     */
    async updateWorkItemTime(
        id: string,
        startTime: Date,
        endTime: Date
    ): Promise<WorkItem> {
        const existingItem = await this.workItemRepository.findById(id);
        if (!existingItem) {
            throw new Error(`找不到 ID 為 ${id} 的工作項目`);
        }

        const workItemVO = this.fromWorkItem(existingItem);
        const updatedWorkItem = workItemVO.updateTime(startTime, endTime);

        // 檢查時間衝突（排除自己）
        await this.validateNoTimeConflicts(updatedWorkItem, id);

        return await this.workItemRepository.update(id, {
            startTime,
            endTime
        } as Partial<WorkItemVO>);
    }

    /**
     * 更新工作項目狀態
     */
    async updateWorkItemStatus(id: string, status: WorkItemStatus): Promise<WorkItem> {
        const existingItem = await this.workItemRepository.findById(id);
        if (!existingItem) {
            throw new Error(`找不到 ID 為 ${id} 的工作項目`);
        }

        return await this.workItemRepository.update(id, { status } as Partial<WorkItemVO>);
    }

    /**
     * 取得指定時間範圍的工作項目
     */
    async getWorkItemsInRange(startTime: Date, endTime: Date): Promise<WorkItem[]> {
        return await this.workItemRepository.findByTimeRange(startTime, endTime);
    }

    /**
     * 取得負責人的工作項目
     */
    async getWorkItemsByAssignee(assigneeId: string): Promise<WorkItem[]> {
        return await this.workItemRepository.findByAssignee(assigneeId);
    }

    /**
     * 檢查工作項目時間衝突
     */
    async checkTimeConflicts(workItem: WorkItemVO, excludeId?: string): Promise<WorkItem[]> {
        return await this.workItemRepository.checkTimeConflicts(workItem, excludeId);
    }

    /**
     * 取得工作負載統計
     */
    async getWorkloadStats(
        assigneeId: string,
        startTime: Date,
        endTime: Date
    ): Promise<WorkloadStats> {
        const workItems = await this.workItemRepository.findByTimeRange(startTime, endTime);
        const assigneeItems = workItems.filter(item => item.assigneeId === assigneeId);

        const totalHours = assigneeItems.reduce((sum, item) => {
            const duration = (item.endTime.getTime() - item.startTime.getTime()) / (1000 * 60 * 60);
            return sum + duration;
        }, 0);

        const itemsByType = assigneeItems.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {} as Record<WorkItemType, number>);

        const itemsByStatus = assigneeItems.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {} as Record<WorkItemStatus, number>);

        return {
            totalItems: assigneeItems.length,
            totalHours,
            itemsByType,
            itemsByStatus,
            workItems: assigneeItems
        };
    }

    /**
     * 驗證沒有時間衝突
     */
    private async validateNoTimeConflicts(workItem: WorkItemVO, excludeId?: string): Promise<void> {
        const conflicts = await this.checkTimeConflicts(workItem, excludeId);
        if (conflicts.length > 0) {
            const conflictTitles = conflicts.map(c => c.title).join(', ');
            throw new Error(`時間與以下工作項目衝突：${conflictTitles}`);
        }
    }

    /**
     * 產生工作項目 ID
     */
    private generateWorkItemId(): string {
        return `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 從 WorkItem 建立 WorkItemVO
     */
    private fromWorkItem(workItem: WorkItem): WorkItemVO {
        return new WorkItemVO(
            workItem.id,
            workItem.title,
            workItem.startTime,
            workItem.endTime,
            workItem.type,
            workItem.status,
            workItem.priority,
            workItem.description,
            workItem.assigneeId,
            workItem.assigneeName,
            workItem.tags,
            workItem.metadata
        );
    }
}

/**
 * 工作負載統計
 */
export interface WorkloadStats {
    totalItems: number;
    totalHours: number;
    itemsByType: Record<WorkItemType, number>;
    itemsByStatus: Record<WorkItemStatus, number>;
    workItems: WorkItem[];
}
