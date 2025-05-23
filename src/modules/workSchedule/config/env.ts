/**
 * 模組環境設定
 * 管理 API 端點和其他環境相關設定
 */

/**
 * API 設定
 */
export const API_CONFIG = {
    // 基礎 URL
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',

    // 工作項目 API 端點
    WORK_ITEMS: {
        BASE: '/work-items',
        BY_ID: (id: string) => `/work-items/${id}`,
        BY_TIME_RANGE: '/work-items/time-range',
        BY_ASSIGNEE: '/work-items/assignee',
        BY_STATUS: '/work-items/status',
        BATCH: '/work-items/batch',
        CONFLICTS: '/work-items/conflicts'
    },

    // 工作排程 API 端點
    SCHEDULE: {
        BASE: '/work-schedule',
        UPDATE_TIME: '/work-schedule/update-time',
        BATCH_UPDATE: '/work-schedule/batch-update',
        VALIDATE: '/work-schedule/validate'
    },

    // 使用者相關 API
    USERS: {
        BASE: '/users',
        PROFILE: '/users/profile',
        ASSIGNEES: '/users/assignees'
    },

    // 請求逾時設定（毫秒）
    TIMEOUT: {
        DEFAULT: 10000,
        UPLOAD: 30000,
        BATCH: 60000
    },

    // 重試設定
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY: 1000,
        BACKOFF_FACTOR: 2
    }
};

/**
 * Timeline 設定
 */
export const TIMELINE_CONFIG = {
    // 預設視圖設定
    DEFAULT_VIEW: {
        ORIENTATION: 'top',
        SHOW_CURRENT_TIME: true,
        SHOW_MAJOR_LABELS: true,
        SHOW_MINOR_LABELS: true,
        STACK: true,
        EDITABLE: true,
        SELECTABLE: true,
        ZOOMABLE: true,
        MOVEABLE: true
    },

    // 時間範圍設定
    TIME_RANGE: {
        DEFAULT_HOURS_BEFORE: 12,
        DEFAULT_HOURS_AFTER: 12,
        MAX_RANGE_DAYS: 90,
        MIN_ZOOM_MINUTES: 15,
        MAX_ZOOM_DAYS: 365
    },

    // 效能設定
    PERFORMANCE: {
        MAX_ITEMS: 1000,
        VIRTUAL_SCROLLING_THRESHOLD: 100,
        DEBOUNCE_DELAY: 300,
        THROTTLE_DELAY: 100
    },

    // 自動更新設定
    AUTO_UPDATE: {
        ENABLED: process.env.NODE_ENV !== 'production',
        INTERVAL: 30000, // 30秒
        MAX_RETRIES: 3
    }
};

/**
 * 快取設定
 */
export const CACHE_CONFIG = {
    // 工作項目快取
    WORK_ITEMS: {
        TTL: 5 * 60 * 1000, // 5分鐘
        MAX_SIZE: 100,
        KEY_PREFIX: 'workItems'
    },

    // 使用者資料快取
    USERS: {
        TTL: 30 * 60 * 1000, // 30分鐘
        MAX_SIZE: 50,
        KEY_PREFIX: 'users'
    },

    // 設定快取
    SETTINGS: {
        TTL: 60 * 60 * 1000, // 1小時
        MAX_SIZE: 10,
        KEY_PREFIX: 'settings'
    }
};

/**
 * 本地儲存設定
 */
export const STORAGE_CONFIG = {
    // LocalStorage 鍵值
    KEYS: {
        TIMELINE_CONFIG: 'workSchedule.timeline.config',
        USER_PREFERENCES: 'workSchedule.user.preferences',
        LAST_VIEW_STATE: 'workSchedule.lastViewState',
        CACHED_DATA: 'workSchedule.cachedData'
    },

    // 資料保留期限
    EXPIRY: {
        USER_PREFERENCES: 30 * 24 * 60 * 60 * 1000, // 30天
        LAST_VIEW_STATE: 7 * 24 * 60 * 60 * 1000,   // 7天
        CACHED_DATA: 1 * 60 * 60 * 1000             // 1小時
    }
};

/**
 * 功能開關
 */
export const FEATURE_FLAGS = {
    // 基本功能
    ENABLE_DRAG_DROP: true,
    ENABLE_KEYBOARD_SHORTCUTS: true,
    ENABLE_CONTEXT_MENU: true,
    ENABLE_TOOLTIPS: true,

    // 進階功能
    ENABLE_BATCH_OPERATIONS: true,
    ENABLE_AUTO_SAVE: true,
    ENABLE_CONFLICT_DETECTION: true,
    ENABLE_UNDO_REDO: false, // 暫時停用

    // 實驗性功能
    ENABLE_VIRTUAL_SCROLLING: false,
    ENABLE_REAL_TIME_SYNC: false,
    ENABLE_OFFLINE_MODE: false,

    // 除錯功能
    ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
    ENABLE_PERFORMANCE_MONITOR: process.env.NODE_ENV === 'development',
    ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production'
};

/**
 * 除錯設定
 */
export const DEBUG_CONFIG = {
    // 日誌等級
    LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error',

    // 除錯標籤
    TAGS: {
        TIMELINE: 'Timeline',
        API: 'API',
        CACHE: 'Cache',
        EVENTS: 'Events',
        PERFORMANCE: 'Performance'
    },

    // 效能監控
    PERFORMANCE_MONITOR: {
        ENABLED: process.env.NODE_ENV === 'development',
        SAMPLE_RATE: 0.1, // 10% 取樣
        THRESHOLDS: {
            RENDER_TIME: 16, // 16ms (60fps)
            API_RESPONSE: 1000, // 1秒
            MEMORY_USAGE: 100 * 1024 * 1024 // 100MB
        }
    }
};

/**
 * 錯誤處理設定
 */
export const ERROR_CONFIG = {
    // 錯誤報告
    REPORTING: {
        ENABLED: process.env.NODE_ENV === 'production',
        ENDPOINT: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT,
        SAMPLE_RATE: 0.1 // 10% 取樣
    },

    // 自動重試
    RETRY: {
        NETWORK_ERROR: 3,
        SERVER_ERROR: 2,
        TIMEOUT_ERROR: 2,
        UNKNOWN_ERROR: 1
    },

    // 降級處理
    FALLBACK: {
        ENABLE_OFFLINE_MODE: true,
        CACHE_FALLBACK: true,
        DEFAULT_ERROR_MESSAGE: '發生未知錯誤，請稍後再試'
    }
};

/**
 * 安全設定
 */
export const SECURITY_CONFIG = {
    // API 請求
    API: {
        ENABLE_CSRF_PROTECTION: true,
        REQUIRE_AUTHENTICATION: true,
        MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
        RATE_LIMIT: {
            REQUESTS_PER_MINUTE: 60,
            BURST_SIZE: 10
        }
    },

    // 資料驗證
    VALIDATION: {
        ENABLE_INPUT_SANITIZATION: true,
        ENABLE_OUTPUT_ENCODING: true,
        MAX_STRING_LENGTH: 1000,
        ALLOWED_FILE_TYPES: ['json', 'csv', 'xlsx']
    }
};

/**
 * 國際化設定
 */
export const I18N_CONFIG = {
    // 支援的語言
    SUPPORTED_LOCALES: ['zh-TW', 'zh-CN', 'en-US'],

    // 預設語言
    DEFAULT_LOCALE: 'zh-TW',

    // 語言偵測
    DETECT_FROM_BROWSER: true,
    DETECT_FROM_PATH: false,
    DETECT_FROM_SUBDOMAIN: false,

    // 日期時間格式
    DATE_FORMAT: {
        'zh-TW': 'YYYY年MM月DD日',
        'zh-CN': 'YYYY年MM月DD日',
        'en-US': 'MM/DD/YYYY'
    },

    TIME_FORMAT: {
        'zh-TW': 'HH:mm',
        'zh-CN': 'HH:mm',
        'en-US': 'h:mm A'
    }
};

/**
 * 取得環境變數
 */
export function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
}

/**
 * 檢查是否為開發環境
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}

/**
 * 檢查是否為生產環境
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * 檢查是否為測試環境
 */
export function isTest(): boolean {
    return process.env.NODE_ENV === 'test';
}

/**
 * 取得完整的 API URL
 */
export function getApiUrl(endpoint: string): string {
    const baseUrl = API_CONFIG.BASE_URL;
    return `${baseUrl}${endpoint}`;
}

/**
 * 取得設定值（支援環境變數覆蓋）
 */
export function getConfig<T>(key: string, defaultValue: T): T {
    const envKey = `NEXT_PUBLIC_${key.toUpperCase().replace(/\./g, '_')}`;
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
        try {
            return JSON.parse(envValue);
        } catch {
            return envValue as unknown as T;
        }
    }

    return defaultValue;
}
