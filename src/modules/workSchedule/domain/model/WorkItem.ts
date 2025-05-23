/**
 * 工作項目實體 - 表示時間軸上的一個工作項目
 */
export interface WorkItem {
    id: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    type: WorkItemType;
    status: WorkItemStatus;
    assigneeId?: string;
    assigneeName?: string;
    priority: WorkItemPriority;
    tags?: string[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export enum WorkItemType {
    TASK = 'task',
    MEETING = 'meeting',
    BREAK = 'break',
    PROJECT = 'project',
    MAINTENANCE = 'maintenance'
}

export enum WorkItemStatus {
    PLANNED = 'planned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    OVERDUE = 'overdue'
}

export enum WorkItemPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

/**
 * 工作項目值物件 - 用於建立和驗證工作項目
 */
export class WorkItemVO {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly startTime: Date,
        public readonly endTime: Date,
        public readonly type: WorkItemType,
        public readonly status: WorkItemStatus = WorkItemStatus.PLANNED,
        public readonly priority: WorkItemPriority = WorkItemPriority.MEDIUM,
        public readonly description?: string,
        public readonly assigneeId?: string,
        public readonly assigneeName?: string,
        public readonly tags?: string[],
        public readonly metadata?: Record<string, any>
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.id || this.id.trim() === '') {
            throw new Error('工作項目 ID 不能為空');
        }

        if (!this.title || this.title.trim() === '') {
            throw new Error('工作項目標題不能為空');
        }

        if (this.startTime >= this.endTime) {
            throw new Error('開始時間必須早於結束時間');
        }

        if (this.startTime < new Date('1900-01-01')) {
            throw new Error('開始時間不能早於 1900 年');
        }
    }

    /**
     * 檢查工作項目是否與另一個工作項目時間重疊
     */
    isOverlapping(other: WorkItemVO): boolean {
        return this.startTime < other.endTime && this.endTime > other.startTime;
    }

    /**
     * 取得工作項目持續時間（毫秒）
     */
    getDurationMs(): number {
        return this.endTime.getTime() - this.startTime.getTime();
    }

    /**
     * 取得工作項目持續時間（小時）
     */
    getDurationHours(): number {
        return this.getDurationMs() / (1000 * 60 * 60);
    }

    /**
     * 更新工作項目時間
     */
    updateTime(startTime: Date, endTime: Date): WorkItemVO {
        return new WorkItemVO(
            this.id,
            this.title,
            startTime,
            endTime,
            this.type,
            this.status,
            this.priority,
            this.description,
            this.assigneeId,
            this.assigneeName,
            this.tags,
            this.metadata
        );
    }

    /**
     * 更新工作項目狀態
     */
    updateStatus(status: WorkItemStatus): WorkItemVO {
        return new WorkItemVO(
            this.id,
            this.title,
            this.startTime,
            this.endTime,
            this.type,
            status,
            this.priority,
            this.description,
            this.assigneeId,
            this.assigneeName,
            this.tags,
            this.metadata
        );
    }

    /**
     * 轉換為一般物件
     */
    toObject(): WorkItem {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            startTime: this.startTime,
            endTime: this.endTime,
            type: this.type,
            status: this.status,
            assigneeId: this.assigneeId,
            assigneeName: this.assigneeName,
            priority: this.priority,
            tags: this.tags,
            metadata: this.metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
