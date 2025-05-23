// 主要導出檔案 - 工作排程模組
// 提供統一的入口點來存取所有工作排程相關的功能

// Domain Layer - 領域層
export type { WorkItem, WorkItemPriority, WorkItemStatus, WorkItemType, WorkItemVO } from './domain/model/WorkItem';
export type { WorkItemRepository } from './domain/repository/WorkItemRepo';

// Application Layer - 應用層
export type {
    CreateWorkItemDTO,
    TimelineConfigDTO,
    TimelineGroupDTO,
    TimelineItemDTO,
    UpdateWorkItemDTO,
    WorkItemDTO,
    WorkItemQueryDTO,
    WorkItemResponseDTO
} from './application/dto/WorkItemDTO';

// Infrastructure Layer - 基礎設施層
import { TimelineAdapter } from './infrastructure/adapter/TimelineAdapter';
import { WorkItemApiRepository } from './infrastructure/repository/WorkItemApiRepo';

// Interface Layer - 介面層
import { default as TimelineComponent } from './interfaces/components/Timeline';
import { default as ToolbarComponent } from './interfaces/components/Toolbar';
export { useTimelineEvents } from './interfaces/hooks/useTimelineEvents';

// Re-export components with default names
export const Timeline = TimelineComponent;
export const Toolbar = ToolbarComponent;

// Types - 型別定義
export type {
    TimelineActions,
    TimelineClickEvent,
    TimelineConfiguration,
    TimelineEditableOptions,
    TimelineEventHandlers,
    TimelineGroupData,
    TimelineItemData,
    TimelineItemEvent,
    TimelineKeyboardShortcuts,
    TimelineLocalization,
    TimelineRangeEvent,
    TimelineSelectEvent,
    TimelineState,
    TimelineTimeEvent,
    TimelineUtils,
    UseTimelineReturn
} from './types/timeline';

// Utils - 工具函式
export {
    addDays,
    addHours,
    addMinutes,
    calculateDurationHours,
    calculateDurationMinutes,
    calculateDurationMs,
    formatDuration,
    formatLocalDate,
    formatLocalDateTime,
    formatLocalTime,
    formatTimeRange,
    fromISOString,
    getMonthEnd,
    getMonthStart,
    getRelativeTime,
    getTodayEnd,
    getTodayStart,
    getWeekEnd,
    getWeekStart,
    getYearEnd,
    getYearStart,
    isThisMonth,
    isThisWeek,
    isThisYear,
    isTimeRangeOverlapping,
    isToday,
    isValidDate,
    TimeRangeValidator,
    toISOString
} from './utils/timeUtils';

// Constants - 常數定義
export {
    ANIMATION_CONFIG,
    CSS_CLASSES,
    DEFAULT_TIME_WINDOWS,
    DEFAULT_TIMELINE_CONFIG,
    DRAG_CONFIG,
    EMPTY_MESSAGES,
    ERROR_MESSAGES,
    KEYBOARD_SHORTCUTS,
    LOADING_MESSAGES,
    PRIORITY_COLORS,
    PRIORITY_INDICATORS,
    PRIORITY_LABELS,
    STATUS_COLORS,
    STATUS_LABELS,
    SUCCESS_MESSAGES,
    TIME_FORMAT,
    TIMELINE_DIMENSIONS,
    TOOLTIP_MESSAGES,
    TYPE_COLORS,
    TYPE_ICONS,
    TYPE_LABELS,
    ZOOM_CONFIG
} from './constants/timelineConstants';

// Config - 設定
export {
    API_CONFIG,
    CACHE_CONFIG,
    DEBUG_CONFIG,
    ERROR_CONFIG,
    FEATURE_FLAGS,
    getApiUrl,
    getConfig,
    getEnvVar,
    I18N_CONFIG,
    isDevelopment,
    isProduction,
    isTest,
    SECURITY_CONFIG,
    STORAGE_CONFIG,
    TIMELINE_CONFIG
} from './config/env';

// 便利的工廠函式
export const createWorkScheduleModule = () => {
    // 建立儲存庫實例並實作必要的介面方法
    const repository: WorkItemRepository = {
        ...new WorkItemApiRepository(),
        // 正確實作 checkTimeConflicts 方法以符合介面定義
        checkTimeConflicts: async (workItem: WorkItemVO, excludeId?: string) => {
            const repo = new WorkItemApiRepository();
            return repo.checkTimeConflicts(workItem.startTime, workItem.endTime, excludeId);
        }
    };

    const scheduleService = new ScheduleService(repository);
    const updateWorkTimeUseCase = new UpdateWorkTimeUseCase(repository, scheduleService);
    const timelineAdapter = new TimelineAdapter();

    return {
        repository,
        scheduleService,
        updateWorkTimeUseCase,
        timelineAdapter
    };
};

// 預設組件名稱的匯出
export const WorkScheduleTimeline = TimelineComponent;
export const WorkScheduleToolbar = ToolbarComponent;
