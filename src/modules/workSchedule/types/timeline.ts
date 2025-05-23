import { TimelineOptions, Timeline as VisTimeline } from 'vis-timeline';
import { WorkItem, WorkItemPriority, WorkItemStatus, WorkItemType } from '../domain/model/WorkItem';

/**
 * Timeline 相關型別定義
 */

/**
 * Timeline 事件型別
 */
export interface TimelineEventHandlers {
    onSelect?: (properties: TimelineSelectEvent) => void;
    onItemover?: (properties: TimelineItemEvent) => void;
    onItemout?: (properties: TimelineItemEvent) => void;
    onClick?: (properties: TimelineClickEvent) => void;
    onDoubleClick?: (properties: TimelineClickEvent) => void;
    onContextMenu?: (properties: TimelineClickEvent) => void;
    onRangeChanged?: (properties: TimelineRangeEvent) => void;
    onTimeChanged?: (properties: TimelineTimeEvent) => void;
    onMove?: (item: any, callback: (item: any) => void) => void;
    onAdd?: (item: any, callback: (item: any) => void) => void;
    onRemove?: (item: any, callback: (item: any) => void) => void;
    onUpdate?: (item: any, callback: (item: any) => void) => void;
}

/**
 * Timeline 選擇事件
 */
export interface TimelineSelectEvent {
    items: string[];
    event: Event;
}

/**
 * Timeline 項目事件
 */
export interface TimelineItemEvent {
    item: string | null;
    event: Event;
}

/**
 * Timeline 點擊事件
 */
export interface TimelineClickEvent {
    what: 'item' | 'background' | 'axis' | 'group-label' | 'custom-time' | 'current-time';
    item: string | null;
    group: string | null;
    time: Date;
    event: Event;
}

/**
 * Timeline 範圍變更事件
 */
export interface TimelineRangeEvent {
    start: Date;
    end: Date;
    byUser: boolean;
    event: Event;
}

/**
 * Timeline 時間變更事件
 */
export interface TimelineTimeEvent {
    id: string;
    time: Date;
    event: Event;
}

/**
 * Timeline 項目資料
 */
export interface TimelineItemData {
    id: string;
    content: string;
    start: Date | string;
    end?: Date | string;
    group?: string;
    className?: string;
    style?: string;
    title?: string;
    type?: 'box' | 'point' | 'range' | 'background';
    editable?: boolean | TimelineEditableOptions;
    selectable?: boolean;
    limitSize?: boolean;
    align?: 'auto' | 'center' | 'left' | 'right';
    subgroup?: string;
}

/**
 * Timeline 群組資料
 */
export interface TimelineGroupData {
    id: string;
    content: string;
    order?: number;
    className?: string;
    style?: string;
    subgroupOrder?: string | ((a: any, b: any) => number);
    title?: string;
    visible?: boolean;
    nestedGroups?: string[];
    showNested?: boolean;
}

/**
 * Timeline 編輯選項
 */
export interface TimelineEditableOptions {
    add?: boolean;
    updateTime?: boolean;
    updateGroup?: boolean;
    remove?: boolean;
    overrideItems?: boolean;
}

/**
 * Timeline 設定選項
 */
export interface TimelineConfiguration extends Partial<TimelineOptions> {
    // 自訂設定選項
    autoResize?: boolean;
    height?: string | number;
    width?: string | number;
    minHeight?: string | number;
    maxHeight?: string | number;

    // 時間軸設定
    showCurrentTime?: boolean;
    showMajorLabels?: boolean;
    showMinorLabels?: boolean;

    // 互動設定
    editable?: boolean | TimelineEditableOptions;
    selectable?: boolean;
    multiselect?: boolean;
    zoomable?: boolean;
    moveable?: boolean;

    // 樣式設定
    orientation?: 'bottom' | 'top' | 'both' | 'none';
    stack?: boolean;
    stackSubgroups?: boolean;

    // 資料載入設定
    loadingScreenTemplate?: () => string;
}

/**
 * Timeline 狀態
 */
export interface TimelineState {
    isLoading: boolean;
    isReady: boolean;
    hasError: boolean;
    errorMessage?: string;
    selectedItems: string[];
    visibleRange: {
        start: Date;
        end: Date;
    };
    currentTime?: Date;
}

/**
 * Timeline 操作介面
 */
export interface TimelineActions {
    // 資料操作
    loadItems: (items: TimelineItemData[]) => void;
    addItem: (item: TimelineItemData) => void;
    updateItem: (item: TimelineItemData) => void;
    removeItem: (itemId: string) => void;
    clearItems: () => void;

    // 群組操作
    loadGroups: (groups: TimelineGroupData[]) => void;
    addGroup: (group: TimelineGroupData) => void;
    removeGroup: (groupId: string) => void;
    clearGroups: () => void;

    // 視圖操作
    setWindow: (start: Date, end: Date) => void;
    fit: () => void;
    focus: (itemId: string | string[]) => void;
    moveTo: (time: Date) => void;
    zoomIn: (percentage?: number) => void;
    zoomOut: (percentage?: number) => void;

    // 選擇操作
    selectItems: (itemIds: string[]) => void;
    unselectAll: () => void;
    getSelection: () => string[];

    // 時間操作
    getCurrentTime: () => Date;
    setCurrentTime: (time: Date) => void;

    // 事件處理
    addEventListener: <K extends keyof TimelineEventHandlers>(
        event: K,
        handler: TimelineEventHandlers[K]
    ) => void;
    removeEventListener: <K extends keyof TimelineEventHandlers>(
        event: K,
        handler: TimelineEventHandlers[K]
    ) => void;
}

/**
 * Timeline Hook 回傳值
 */
export interface UseTimelineReturn {
    timeline: VisTimeline | null;
    state: TimelineState;
    actions: TimelineActions;
    containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Timeline 工具函式
 */
export interface TimelineUtils {
    // 資料轉換
    workItemToTimelineItem: (workItem: WorkItem) => TimelineItemData;
    timelineItemToWorkItem: (item: TimelineItemData) => Partial<WorkItem>;

    // 時間處理
    formatTimeRange: (start: Date, end: Date) => string;
    calculateDuration: (start: Date, end: Date) => number;
    isOverlapping: (item1: TimelineItemData, item2: TimelineItemData) => boolean;

    // 樣式處理
    getItemClassName: (workItem: WorkItem) => string;
    getItemStyle: (workItem: WorkItem) => string;
    getStatusColor: (status: WorkItemStatus) => string;
    getTypeIcon: (type: WorkItemType) => string;
    getPriorityIndicator: (priority: WorkItemPriority) => string;

    // 驗證
    validateTimelineItem: (item: TimelineItemData) => boolean;
    validateTimeRange: (start: Date, end: Date) => boolean;
}

/**
 * Timeline 快捷鍵設定
 */
export interface TimelineKeyboardShortcuts {
    delete?: string;
    copy?: string;
    paste?: string;
    selectAll?: string;
    zoomIn?: string;
    zoomOut?: string;
    fit?: string;
    today?: string;
    previousPeriod?: string;
    nextPeriod?: string;
}

/**
 * Timeline 本地化設定
 */
export interface TimelineLocalization {
    days: string[];
    daysShort: string[];
    months: string[];
    monthsShort: string[];

    // 按鈕文字
    today: string;
    previous: string;
    next: string;
    zoomIn: string;
    zoomOut: string;
    fit: string;

    // 訊息文字
    loading: string;
    noData: string;
    error: string;

    // 工具提示
    tooltips: {
        add: string;
        edit: string;
        delete: string;
        move: string;
        select: string;
    };
}
