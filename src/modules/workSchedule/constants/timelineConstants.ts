import { WorkItemPriority, WorkItemStatus, WorkItemType } from '../domain/model/WorkItem';

/**
 * Timeline 相關常數與設定值
 */

/**
 * 預設 Timeline 設定
 */
export const DEFAULT_TIMELINE_CONFIG = {
    orientation: 'top' as const,
    stack: true,
    stackSubgroups: true,
    showCurrentTime: true,
    showMajorLabels: true,
    showMinorLabels: true,
    editable: {
        add: false,
        updateTime: true,
        updateGroup: true,
        remove: true,
        overrideItems: false
    },
    selectable: true,
    multiselect: false,
    zoomable: true,
    moveable: true,
    margin: {
        item: 10,
        axis: 20
    },
    timeAxis: {
        scale: 'hour' as const,
        step: 1
    }
};

/**
 * 時間格式設定
 */
export const TIME_FORMAT = {
    minorLabels: {
        millisecond: 'SSS',
        second: 'ss',
        minute: 'HH:mm',
        hour: 'HH:mm',
        weekday: 'ddd DD',
        day: 'DD',
        week: 'w',
        month: 'MMM',
        year: 'YYYY'
    },
    majorLabels: {
        millisecond: 'HH:mm:ss',
        second: 'DD MMMM HH:mm',
        minute: 'ddd DD MMMM',
        hour: 'ddd DD MMMM',
        weekday: 'MMMM YYYY',
        day: 'MMMM YYYY',
        week: 'MMMM YYYY',
        month: 'YYYY',
        year: ''
    }
};

/**
 * 狀態顏色對應
 */
export const STATUS_COLORS = {
    [WorkItemStatus.PLANNED]: {
        background: '#e3f2fd',
        border: '#2196f3',
        text: '#1976d2'
    },
    [WorkItemStatus.IN_PROGRESS]: {
        background: '#fff3e0',
        border: '#ff9800',
        text: '#f57c00'
    },
    [WorkItemStatus.COMPLETED]: {
        background: '#e8f5e8',
        border: '#4caf50',
        text: '#388e3c'
    },
    [WorkItemStatus.CANCELLED]: {
        background: '#fce4ec',
        border: '#e91e63',
        text: '#c2185b'
    },
    [WorkItemStatus.OVERDUE]: {
        background: '#ffebee',
        border: '#f44336',
        text: '#d32f2f'
    }
};

/**
 * 類型圖示對應
 */
export const TYPE_ICONS = {
    [WorkItemType.TASK]: '📝',
    [WorkItemType.MEETING]: '👥',
    [WorkItemType.BREAK]: '☕',
    [WorkItemType.PROJECT]: '📊',
    [WorkItemType.MAINTENANCE]: '🔧'
};

/**
 * 類型顏色對應
 */
export const TYPE_COLORS = {
    [WorkItemType.TASK]: '#2196f3',
    [WorkItemType.MEETING]: '#ff9800',
    [WorkItemType.BREAK]: '#4caf50',
    [WorkItemType.PROJECT]: '#9c27b0',
    [WorkItemType.MAINTENANCE]: '#f44336'
};

/**
 * 優先級顏色對應
 */
export const PRIORITY_COLORS = {
    [WorkItemPriority.LOW]: '#4caf50',
    [WorkItemPriority.MEDIUM]: '#ff9800',
    [WorkItemPriority.HIGH]: '#f44336',
    [WorkItemPriority.URGENT]: '#9c27b0'
};

/**
 * 優先級指示器
 */
export const PRIORITY_INDICATORS = {
    [WorkItemPriority.LOW]: '🟢',
    [WorkItemPriority.MEDIUM]: '🟡',
    [WorkItemPriority.HIGH]: '🔴',
    [WorkItemPriority.URGENT]: '🟣'
};

/**
 * 狀態文字對應
 */
export const STATUS_LABELS = {
    [WorkItemStatus.PLANNED]: '已規劃',
    [WorkItemStatus.IN_PROGRESS]: '進行中',
    [WorkItemStatus.COMPLETED]: '已完成',
    [WorkItemStatus.CANCELLED]: '已取消',
    [WorkItemStatus.OVERDUE]: '逾期'
};

/**
 * 類型文字對應
 */
export const TYPE_LABELS = {
    [WorkItemType.TASK]: '任務',
    [WorkItemType.MEETING]: '會議',
    [WorkItemType.BREAK]: '休息',
    [WorkItemType.PROJECT]: '專案',
    [WorkItemType.MAINTENANCE]: '維護'
};

/**
 * 優先級文字對應
 */
export const PRIORITY_LABELS = {
    [WorkItemPriority.LOW]: '低',
    [WorkItemPriority.MEDIUM]: '中',
    [WorkItemPriority.HIGH]: '高',
    [WorkItemPriority.URGENT]: '緊急'
};

/**
 * 預設時間視窗設定
 */
export const DEFAULT_TIME_WINDOWS = {
    DAY: {
        hours: 24,
        label: '日'
    },
    WEEK: {
        hours: 24 * 7,
        label: '週'
    },
    MONTH: {
        hours: 24 * 30,
        label: '月'
    },
    YEAR: {
        hours: 24 * 365,
        label: '年'
    }
};

/**
 * Timeline 尺寸設定
 */
export const TIMELINE_DIMENSIONS = {
    MIN_HEIGHT: 200,
    DEFAULT_HEIGHT: 400,
    MAX_HEIGHT: 800,
    ITEM_HEIGHT: 30,
    GROUP_HEIGHT: 40,
    AXIS_HEIGHT: 60
};

/**
 * 拖曳設定
 */
export const DRAG_CONFIG = {
    SNAP_TO_MINUTES: 15, // 拖曳時對齊到15分鐘
    MIN_DURATION_MINUTES: 15, // 最小持續時間15分鐘
    MAX_DURATION_HOURS: 24, // 最大持續時間24小時
    OVERLAP_TOLERANCE_MINUTES: 5 // 重疊容忍度5分鐘
};

/**
 * 縮放設定
 */
export const ZOOM_CONFIG = {
    MIN_SCALE: 0.1,
    MAX_SCALE: 10,
    ZOOM_STEP: 0.1,
    DEFAULT_SCALE: 1
};

/**
 * 動畫設定
 */
export const ANIMATION_CONFIG = {
    DURATION: 300,
    EASING: 'ease-in-out',
    DELAY: 0
};

/**
 * 鍵盤快捷鍵
 */
export const KEYBOARD_SHORTCUTS = {
    DELETE: 'Delete',
    COPY: 'Ctrl+C',
    PASTE: 'Ctrl+V',
    SELECT_ALL: 'Ctrl+A',
    ZOOM_IN: 'Ctrl+=',
    ZOOM_OUT: 'Ctrl+-',
    FIT: 'Ctrl+0',
    TODAY: 'T',
    PREVIOUS_PERIOD: 'ArrowLeft',
    NEXT_PERIOD: 'ArrowRight'
};

/**
 * CSS 類別名稱
 */
export const CSS_CLASSES = {
    // Timeline 容器
    TIMELINE_CONTAINER: 'timeline-container',
    TIMELINE_VIS: 'timeline-vis',

    // 項目樣式
    TIMELINE_ITEM: 'timeline-item',
    TIMELINE_ITEM_CONTENT: 'timeline-item-content',
    TIMELINE_ITEM_ICONS: 'timeline-item-icons',
    TIMELINE_ITEM_TITLE: 'timeline-item-title',

    // 狀態樣式
    STATUS_PLANNED: 'status-planned',
    STATUS_IN_PROGRESS: 'status-in-progress',
    STATUS_COMPLETED: 'status-completed',
    STATUS_CANCELLED: 'status-cancelled',
    STATUS_OVERDUE: 'status-overdue',

    // 類型樣式
    TYPE_TASK: 'type-task',
    TYPE_MEETING: 'type-meeting',
    TYPE_BREAK: 'type-break',
    TYPE_PROJECT: 'type-project',
    TYPE_MAINTENANCE: 'type-maintenance',

    // 優先級樣式
    PRIORITY_LOW: 'priority-low',
    PRIORITY_MEDIUM: 'priority-medium',
    PRIORITY_HIGH: 'priority-high',
    PRIORITY_URGENT: 'priority-urgent',

    // 群組樣式
    GROUP_ASSIGNEE: 'group-assignee',
    GROUP_UNASSIGNED: 'group-unassigned',

    // 狀態類別
    LOADING: 'timeline-loading',
    ERROR: 'timeline-error',
    EMPTY: 'timeline-empty',

    // 工具列
    TOOLBAR: 'timeline-toolbar',
    TOOLBAR_MAIN: 'toolbar-main',
    TOOLBAR_FILTERS: 'toolbar-filters'
};

/**
 * 錯誤訊息
 */
export const ERROR_MESSAGES = {
    INITIALIZATION_FAILED: 'Timeline 初始化失敗',
    LOAD_DATA_FAILED: '載入資料失敗',
    UPDATE_ITEM_FAILED: '更新項目失敗',
    DELETE_ITEM_FAILED: '刪除項目失敗',
    INVALID_TIME_RANGE: '無效的時間範圍',
    TIME_CONFLICT: '時間衝突',
    NETWORK_ERROR: '網路錯誤',
    PERMISSION_DENIED: '權限不足'
};

/**
 * 成功訊息
 */
export const SUCCESS_MESSAGES = {
    ITEM_CREATED: '項目建立成功',
    ITEM_UPDATED: '項目更新成功',
    ITEM_DELETED: '項目刪除成功',
    DATA_LOADED: '資料載入成功',
    SETTINGS_SAVED: '設定儲存成功'
};

/**
 * 載入狀態文字
 */
export const LOADING_MESSAGES = {
    INITIALIZING: '正在初始化...',
    LOADING_DATA: '正在載入資料...',
    SAVING: '正在儲存...',
    DELETING: '正在刪除...',
    UPDATING: '正在更新...'
};

/**
 * 空狀態文字
 */
export const EMPTY_MESSAGES = {
    NO_ITEMS: '沒有工作項目',
    NO_RESULTS: '沒有搜尋結果',
    NO_DATA: '沒有資料'
};

/**
 * 工具提示文字
 */
export const TOOLTIP_MESSAGES = {
    ADD_ITEM: '新增工作項目',
    EDIT_ITEM: '編輯工作項目',
    DELETE_ITEM: '刪除工作項目',
    MOVE_ITEM: '拖曳移動項目',
    SELECT_ITEM: '選擇項目',
    ZOOM_IN: '放大',
    ZOOM_OUT: '縮小',
    FIT_WINDOW: '適合視窗',
    TODAY: '回到今天',
    PREVIOUS: '上一個時間段',
    NEXT: '下一個時間段',
    REFRESH: '重新整理'
};
