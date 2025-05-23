/**
 * 日期格式化工具
 */

import moment from 'moment';

/**
 * 標準日期格式
 */
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * 標準時間格式
 */
export const DEFAULT_TIME_FORMAT = 'HH:mm';

/**
 * 標準日期時間格式
 */
export const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

/**
 * 預設的日期標籤格式
 */
export const DEFAULT_TIMELINE_FORMAT = {
  minorLabels: {
    millisecond: 'SSS',
    second: 's',
    minute: 'HH:mm',
    hour: 'HH:mm',
    weekday: 'ddd D',
    day: 'D',
    week: 'w',
    month: 'MMM',
    year: 'YYYY'
  },
  majorLabels: {
    millisecond: 'HH:mm:ss',
    second: 'D MMMM HH:mm',
    minute: 'ddd D MMMM',
    hour: 'ddd D MMMM',
    weekday: 'MMMM YYYY',
    day: 'MMMM YYYY',
    week: 'MMMM YYYY',
    month: 'YYYY',
    year: ''
  }
};

/**
 * 格式化日期
 * @param date 日期
 * @param format 格式字串
 * @returns 格式化後的日期字串
 */
export const formatDate = (date: Date | string | number, format: string = DEFAULT_DATE_FORMAT): string => {
  return moment(date).format(format);
};

/**
 * 格式化時間
 * @param date 日期
 * @param format 格式字串
 * @returns 格式化後的時間字串
 */
export const formatTime = (date: Date | string | number, format: string = DEFAULT_TIME_FORMAT): string => {
  return moment(date).format(format);
};

/**
 * 格式化日期時間
 * @param date 日期
 * @param format 格式字串
 * @returns 格式化後的日期時間字串
 */
export const formatDateTime = (date: Date | string | number, format: string = DEFAULT_DATETIME_FORMAT): string => {
  return moment(date).format(format);
};

/**
 * 將字串轉換為日期物件
 * @param dateString 日期字串
 * @param format 格式字串
 * @returns 日期物件
 */
export const parseDate = (dateString: string, format: string = DEFAULT_DATE_FORMAT): Date => {
  return moment(dateString, format).toDate();
};

/**
 * 取得當前日期
 * @param format 格式字串
 * @returns 當前日期字串
 */
export const getCurrentDate = (format: string = DEFAULT_DATE_FORMAT): string => {
  return moment().format(format);
};

/**
 * 取得當前時間
 * @param format 格式字串
 * @returns 當前時間字串
 */
export const getCurrentTime = (format: string = DEFAULT_TIME_FORMAT): string => {
  return moment().format(format);
};

/**
 * 取得當前日期時間
 * @param format 格式字串
 * @returns 當前日期時間字串
 */
export const getCurrentDateTime = (format: string = DEFAULT_DATETIME_FORMAT): string => {
  return moment().format(format);
};
