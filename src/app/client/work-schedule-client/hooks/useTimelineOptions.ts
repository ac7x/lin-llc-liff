/**
 * Timeline 選項管理 Hook
 */

import { useState, useCallback, useMemo } from 'react';
import { TimelineOptions } from '../types/TimelineOptions';
import { DEFAULT_TIMELINE_FORMAT } from '../utils/formatters';
import { getLocaleMessages } from '../utils/locales';
import { createUTCMomentFunction } from '../utils/timeZoneUtils';

interface UseTimelineOptionsProps {
  /**
   * 初始選項
   */
  initialOptions?: Partial<TimelineOptions>;
  
  /**
   * 語系設定
   */
  locale?: string;
  
  /**
   * 是否使用 UTC 時間
   */
  useUtc?: boolean;
}

interface UseTimelineOptionsReturn {
  /**
   * 目前的選項設定
   */
  options: Partial<TimelineOptions>;
  
  /**
   * 更新選項
   */
  updateOptions: (newOptions: Partial<TimelineOptions>) => void;
  
  /**
   * 設定時間範圍
   */
  setTimeRange: (start: Date, end: Date) => void;
  
  /**
   * 設定語系
   */
  setLocale: (locale: string) => void;
  
  /**
   * 設定格式化選項
   */
  setFormat: (format: TimelineOptions['format']) => void;
  
  /**
   * 設定是否顯示當前時間
   */
  setShowCurrentTime: (show: boolean) => void;
  
  /**
   * 切換是否可拖曳
   */
  toggleMoveable: () => void;
  
  /**
   * 切換是否可縮放
   */
  toggleZoomable: () => void;
}

/**
 * 預設 Timeline 選項
 */
const DEFAULT_OPTIONS: Partial<TimelineOptions> = {
  width: '100%',
  height: '400px',
  align: 'center',
  autoResize: true,
  clickToUse: false,
  showCurrentTime: true,
  showMajorLabels: true,
  showMinorLabels: true,
  stack: true,
  moveable: true,
  zoomable: true,
  selectable: true,
  multiselect: false,
  multiselectPerGroup: false,
  format: DEFAULT_TIMELINE_FORMAT,
  margin: {
    axis: 20,
    item: 10
  }
};

/**
 * Timeline 選項管理 Hook
 * @param props Hook 選項
 * @returns Timeline 選項相關函數和狀態
 */
export const useTimelineOptions = (
  props: UseTimelineOptionsProps = {}
): UseTimelineOptionsReturn => {
  // 初始選項
  const initialOptions = useMemo(() => {
    const options = { ...DEFAULT_OPTIONS, ...props.initialOptions };
    
    // 設定語系
    if (props.locale) {
      options.locale = props.locale;
      options.locales = {
        [props.locale]: getLocaleMessages(props.locale)
      };
    }
    
    // 設定時區
    if (props.useUtc) {
      options.moment = createUTCMomentFunction();
    }
    
    return options;
  }, [props.initialOptions, props.locale, props.useUtc]);

  // 選項狀態
  const [options, setOptions] = useState<Partial<TimelineOptions>>(initialOptions);

  // 更新選項
  const updateOptions = useCallback((newOptions: Partial<TimelineOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // 設定時間範圍
  const setTimeRange = useCallback((start: Date, end: Date) => {
    setOptions(prev => ({ ...prev, start, end }));
  }, []);

  // 設定語系
  const setLocale = useCallback((locale: string) => {
    setOptions(prev => ({
      ...prev,
      locale,
      locales: {
        ...(prev.locales || {}),
        [locale]: getLocaleMessages(locale)
      }
    }));
  }, []);

  // 設定格式化選項
  const setFormat = useCallback((format: TimelineOptions['format']) => {
    setOptions(prev => ({ ...prev, format }));
  }, []);

  // 設定是否顯示當前時間
  const setShowCurrentTime = useCallback((show: boolean) => {
    setOptions(prev => ({ ...prev, showCurrentTime: show }));
  }, []);

  // 切換是否可拖曳
  const toggleMoveable = useCallback(() => {
    setOptions(prev => ({ ...prev, moveable: !prev.moveable }));
  }, []);

  // 切換是否可縮放
  const toggleZoomable = useCallback(() => {
    setOptions(prev => ({ ...prev, zoomable: !prev.zoomable }));
  }, []);

  return {
    options,
    updateOptions,
    setTimeRange,
    setLocale,
    setFormat,
    setShowCurrentTime,
    toggleMoveable,
    toggleZoomable
  };
};
