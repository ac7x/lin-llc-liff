import { WorkItemPriority, WorkItemStatus, WorkItemType } from '../../domain/model/WorkItem';

/**
 * 工作項目 DTO - 對外溝通資料結構
 * 用於 API 傳輸和前端顯示
 */
export interface WorkItemDTO {
    id: string;
    title: string;
    description?: string;
    startTime: string; // ISO 字串格式
    endTime: string;   // ISO 字串格式
    type: WorkItemType;
    status: WorkItemStatus;
    assigneeId?: string;
    assigneeName?: string;
    priority: WorkItemPriority;
    tags?: string[];
    metadata?: Record<string, any>;
    createdAt: string; // ISO 字串格式
    updatedAt: string; // ISO 字串格式
    duration?: number; // 持續時間（分鐘）
}

/**
 * 建立工作項目 DTO
 */
export interface CreateWorkItemDTO {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    type: WorkItemType;
    assigneeId?: string;
    priority?: WorkItemPriority;
    tags?: string[];
    metadata?: Record<string, any>;
}

/**
 * 更新工作項目 DTO
 */
export interface UpdateWorkItemDTO {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    type?: WorkItemType;
    status?: WorkItemStatus;
    assigneeId?: string;
    priority?: WorkItemPriority;
    tags?: string[];
    metadata?: Record<string, any>;
}

/**
 * 工作項目查詢參數 DTO
 */
export interface WorkItemQueryDTO {
    startTime?: string;
    endTime?: string;
    assigneeId?: string;
    status?: WorkItemStatus;
    type?: WorkItemType;
    priority?: WorkItemPriority;
    tags?: string[];
    page?: number;
    limit?: number;
    sortBy?: 'startTime' | 'endTime' | 'priority' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

/**
 * 工作項目回應 DTO
 */
export interface WorkItemResponseDTO {
    data: WorkItemDTO[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * vis-timeline 專用的資料格式
 */
export interface TimelineItemDTO {
    id: string;
    content: string;
    start: Date | string;
    end?: Date | string;
    group?: string;
    className?: string;
    style?: string;
    type?: 'box' | 'point' | 'range' | 'background';
    title?: string;
    editable?: boolean | {
        add?: boolean;
        updateTime?: boolean;
        updateGroup?: boolean;
        remove?: boolean;
        overrideItems?: boolean;
    };
}

/**
 * vis-timeline 群組格式
 */
export interface TimelineGroupDTO {
    id: string;
    content: string;
    order?: number;
    className?: string;
    style?: string;
    subgroupOrder?: string | (() => number);
    title?: string;
}

/**
 * Timeline 設定 DTO
 */
export interface TimelineConfigDTO {
    orientation?: 'bottom' | 'top' | 'both' | 'none';
    stack?: boolean;
    stackSubgroups?: boolean;
    showCurrentTime?: boolean;
    showMajorLabels?: boolean;
    showMinorLabels?: boolean;
    timeAxis?: {
        scale?: 'millisecond' | 'second' | 'minute' | 'hour' | 'weekday' | 'day' | 'week' | 'month' | 'year';
        step?: number;
    };
    format?: {
        minorLabels?: {
            millisecond?: string;
            second?: string;
            minute?: string;
            hour?: string;
            weekday?: string;
            day?: string;
            week?: string;
            month?: string;
            year?: string;
        };
        majorLabels?: {
            millisecond?: string;
            second?: string;
            minute?: string;
            hour?: string;
            weekday?: string;
            day?: string;
            week?: string;
            month?: string;
            year?: string;
        };
    };
    editable?: boolean | {
        add?: boolean;
        updateTime?: boolean;
        updateGroup?: boolean;
        remove?: boolean;
        overrideItems?: boolean;
    };
    selectable?: boolean;
    multiselect?: boolean;
    zoomable?: boolean;
    moveable?: boolean;
}
