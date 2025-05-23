import { WorkItem, WorkItemVO } from '../model/WorkItem';

/**
 * 工作項目儲存庫抽象介面
 * 定義資料存取的契約，不依賴具體實作
 */
export interface WorkItemRepository {
    /**
     * 根據 ID 取得工作項目
     */
    findById(id: string): Promise<WorkItem | null>;

    /**
     * 根據時間範圍取得工作項目
     */
    findByTimeRange(startTime: Date, endTime: Date): Promise<WorkItem[]>;

    /**
     * 根據負責人取得工作項目
     */
    findByAssignee(assigneeId: string): Promise<WorkItem[]>;

    /**
     * 根據狀態取得工作項目
     */
    findByStatus(status: string): Promise<WorkItem[]>;

    /**
     * 取得所有工作項目
     */
    findAll(): Promise<WorkItem[]>;

    /**
     * 儲存工作項目
     */
    save(workItem: WorkItemVO): Promise<WorkItem>;

    /**
     * 更新工作項目
     */
    update(id: string, workItem: Partial<WorkItemVO>): Promise<WorkItem>;

    /**
     * 刪除工作項目
     */
    delete(id: string): Promise<boolean>;

    /**
     * 批次儲存工作項目
     */
    saveBatch(workItems: WorkItemVO[]): Promise<WorkItem[]>;

    /**
     * 檢查時間衝突
     */
    checkTimeConflicts(workItem: WorkItemVO, excludeId?: string): Promise<WorkItem[]>;
}

/**
 * 工作項目查詢參數
 */
export interface WorkItemQueryParams {
    startTime?: Date;
    endTime?: Date;
    assigneeId?: string;
    status?: string;
    type?: string;
    priority?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'startTime' | 'endTime' | 'title' | 'priority' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

/**
 * 分頁查詢結果
 */
export interface WorkItemQueryResult {
    items: WorkItem[];
    total: number;
    hasMore: boolean;
    nextOffset?: number;
}
