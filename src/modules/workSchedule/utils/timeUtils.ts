/**
 * 時間工具函式
 * 提供時間處理相關的共用方法
 */

/**
 * 格式化時間範圍顯示
 */
export function formatTimeRange(start: Date, end: Date): string {
    const startStr = start.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const endStr = end.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `${startStr} - ${endStr}`;
}

/**
 * 格式化持續時間
 */
export function formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}天${remainingHours}小時` : `${days}天`;
    }

    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}小時${remainingMinutes}分鐘` : `${hours}小時`;
    }

    return `${minutes}分鐘`;
}

/**
 * 計算兩個時間之間的持續時間（毫秒）
 */
export function calculateDurationMs(start: Date, end: Date): number {
    return end.getTime() - start.getTime();
}

/**
 * 計算兩個時間之間的持續時間（分鐘）
 */
export function calculateDurationMinutes(start: Date, end: Date): number {
    return Math.floor(calculateDurationMs(start, end) / (1000 * 60));
}

/**
 * 計算兩個時間之間的持續時間（小時）
 */
export function calculateDurationHours(start: Date, end: Date): number {
    return calculateDurationMs(start, end) / (1000 * 60 * 60);
}

/**
 * 檢查兩個時間範圍是否重疊
 */
export function isTimeRangeOverlapping(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
): boolean {
    return start1 < end2 && end1 > start2;
}

/**
 * 取得今天的開始時間（00:00:00）
 */
export function getTodayStart(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

/**
 * 取得今天的結束時間（23:59:59.999）
 */
export function getTodayEnd(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, -1);
}

/**
 * 取得本週的開始時間（週一 00:00:00）
 */
export function getWeekStart(date: Date = new Date()): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 調整為週一開始
    return new Date(date.getFullYear(), date.getMonth(), diff);
}

/**
 * 取得本週的結束時間（週日 23:59:59.999）
 */
export function getWeekEnd(date: Date = new Date()): Date {
    const weekStart = getWeekStart(date);
    return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7, 0, 0, 0, -1);
}

/**
 * 取得本月的開始時間（1日 00:00:00）
 */
export function getMonthStart(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 取得本月的結束時間（最後一日 23:59:59.999）
 */
export function getMonthEnd(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * 取得本年的開始時間（1月1日 00:00:00）
 */
export function getYearStart(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), 0, 1);
}

/**
 * 取得本年的結束時間（12月31日 23:59:59.999）
 */
export function getYearEnd(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * 將日期格式化為 ISO 字串（用於 API 傳輸）
 */
export function toISOString(date: Date): string {
    return date.toISOString();
}

/**
 * 從 ISO 字串解析日期
 */
export function fromISOString(isoString: string): Date {
    return new Date(isoString);
}

/**
 * 格式化日期為本地字串
 */
export function formatLocalDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };

    return date.toLocaleDateString('zh-TW', { ...defaultOptions, ...options });
}

/**
 * 格式化時間為本地字串
 */
export function formatLocalTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    return date.toLocaleTimeString('zh-TW', { ...defaultOptions, ...options });
}

/**
 * 格式化日期時間為本地字串
 */
export function formatLocalDateTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };

    return date.toLocaleString('zh-TW', { ...defaultOptions, ...options });
}

/**
 * 檢查是否為有效日期
 */
export function isValidDate(date: any): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 檢查日期是否為今天
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

/**
 * 檢查日期是否為本週
 */
export function isThisWeek(date: Date): boolean {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    return date >= weekStart && date <= weekEnd;
}

/**
 * 檢查日期是否為本月
 */
export function isThisMonth(date: Date): boolean {
    const today = new Date();
    return date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

/**
 * 檢查日期是否為本年
 */
export function isThisYear(date: Date): boolean {
    const today = new Date();
    return date.getFullYear() === today.getFullYear();
}

/**
 * 加上指定的天數
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * 加上指定的小時數
 */
export function addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}

/**
 * 加上指定的分鐘數
 */
export function addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
}

/**
 * 取得相對時間描述（例如：2小時前、1天後）
 */
export function getRelativeTime(date: Date, baseDate: Date = new Date()): string {
    const diffMs = date.getTime() - baseDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffDays) >= 1) {
        return diffDays > 0 ? `${diffDays}天後` : `${Math.abs(diffDays)}天前`;
    }

    if (Math.abs(diffHours) >= 1) {
        return diffHours > 0 ? `${diffHours}小時後` : `${Math.abs(diffHours)}小時前`;
    }

    if (Math.abs(diffMinutes) >= 1) {
        return diffMinutes > 0 ? `${diffMinutes}分鐘後` : `${Math.abs(diffMinutes)}分鐘前`;
    }

    return '剛剛';
}

/**
 * 時間範圍檢查工具
 */
export const TimeRangeValidator = {
    /**
     * 檢查時間範圍是否有效
     */
    isValid(start: Date, end: Date): boolean {
        return isValidDate(start) && isValidDate(end) && start < end;
    },

    /**
     * 檢查時間範圍是否在工作時間內
     */
    isWithinWorkingHours(start: Date, end: Date, workStartHour = 9, workEndHour = 18): boolean {
        const startHour = start.getHours();
        const endHour = end.getHours();
        return startHour >= workStartHour && endHour <= workEndHour;
    },

    /**
     * 檢查時間範圍是否跨越多天
     */
    isMultiDay(start: Date, end: Date): boolean {
        return start.getDate() !== end.getDate() ||
            start.getMonth() !== end.getMonth() ||
            start.getFullYear() !== end.getFullYear();
    },

    /**
     * 檢查時間範圍長度是否合理
     */
    isReasonableDuration(start: Date, end: Date, maxHours = 24): boolean {
        const durationHours = calculateDurationHours(start, end);
        return durationHours > 0 && durationHours <= maxHours;
    }
};
