// 主要導出檔案 - 工作排程模組
// 提供統一的入口點來存取所有工作排程相關的功能

// Domain Layer - 領域層
export { WorkItem, WorkItemPriority, WorkItemStatus, WorkItemType, WorkItemVO } from './domain/model/WorkItem';
export type { WorkItemRepository } from './domain/repository/WorkItemRepo';
export { ScheduleService } from './domain/service/ScheduleService';

// Application Layer - 應用層
export type {
    CreateWorkItemRequest, TimelineDataItem, UpdateWorkItemRequest, WorkItemDTO, WorkItemFilters,
    WorkItemSummary
} from './application/dto/WorkItemDTO';
export { UpdateWorkTimeUseCase } from './application/usecases/UpdateWorkTime';

// Infrastructure Layer - 基礎設施層
export { TimelineAdapter } from './infrastructure/adapter/TimelineAdapter';
export { WorkItemApiRepository } from './infrastructure/repository/WorkItemApiRepo';

// Interface Layer - 介面層
export { Timeline } from './interfaces/components/Timeline';
export { Toolbar } from './interfaces/components/Toolbar';
export { useTimelineEvents } from './interfaces/hooks/useTimelineEvents';

// Types - 型別定義
export type {
    EventHandlers, TimelineData, TimelineEvent, TimelineGroup, TimelineItem, TimelineOptions, TimelineState, ViewMode
} from './types/timeline';

// Utils - 工具函式
export {
    adjustTimeToSlot, createTimeRange,
    formatDuration, formatTimeForTimeline, getDuration, getTimeSlots, isTimeOverlap, isValidTimeRange, isWorkingHours, parseTimelineTime
} from './utils/timeUtils';

// Constants - 常數定義
export {
    DEFAULT_TIMELINE_OPTIONS, PRIORITY_COLORS, STATUS_COLORS, TIMELINE_CONFIG, TIME_FORMATS, VIEW_MODES, WORK_ITEM_COLORS
} from './constants/timelineConstants';

// Config - 設定
export {
    API_CONFIG, PERFORMANCE_CONFIG, TIMELINE_FEATURES,
    UI_CONFIG
} from './config/env';

// 便利的工廠函式
export const createWorkScheduleModule = () => {
    const repository = new WorkItemApiRepository();
    const scheduleService = new ScheduleService(repository);
    const updateWorkTimeUseCase = new UpdateWorkTimeUseCase(repository);
    const timelineAdapter = new TimelineAdapter();

    return {
        repository,
        scheduleService,
        updateWorkTimeUseCase,
        timelineAdapter
    };
};

// 預設配置的 Timeline 元件
export const WorkScheduleTimeline = Timeline;
export const WorkScheduleToolbar = Toolbar;
