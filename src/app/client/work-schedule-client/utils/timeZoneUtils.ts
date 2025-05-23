/**
 * 時區處理工具
 */

import moment, { Moment } from 'moment';
import 'moment-timezone';

/**
 * 設定使用 UTC 時間
 * @param date 日期
 * @returns 轉換為 UTC 的 Moment 物件
 */
export const useUTC = (date: Date | string | number): Moment => {
  return moment(date).utc();
};

/**
 * 設定指定時區的時間
 * @param date 日期
 * @param timezone 時區，例如 '+08:00', 'Asia/Taipei'
 * @returns 指定時區的 Moment 物件
 */
export const useTimezone = (date: Date | string | number, timezone: string): Moment => {
  return moment.tz(date, timezone);
};

/**
 * 取得當前時區的偏移量 (分鐘)
 * @returns 時區偏移量 (分鐘)
 */
export const getCurrentTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * 取得當前時區名稱
 * @returns 時區名稱
 */
export const getCurrentTimezoneName = (): string => {
  return moment.tz.guess();
};

/**
 * 建立 Timeline 用的 moment 函數 (UTC)
 * @returns 傳入日期時會轉換為 UTC 的函數
 */
export const createUTCMomentFunction = (): (date: Date) => Moment => {
  return (date: Date) => moment(date).utc();
};

/**
 * 建立 Timeline 用的 moment 函數 (指定時區)
 * @param timezone 時區
 * @returns 傳入日期時會轉換為指定時區的函數
 */
export const createTimezoneMomentFunction = (timezone: string): (date: Date) => Moment => {
  return (date: Date) => moment(date).utcOffset(timezone);
};
