/**
 * Timeline 資料處理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { TimelineItem } from '../types/TimelineItem';
import { TimelineGroup } from '../types/TimelineGroup';

interface TimelineDataState {
  items: TimelineItem[];
  groups?: TimelineGroup[];
  loading: boolean;
  error: Error | null;
}

interface UseTimelineDataReturn extends TimelineDataState {
  /**
   * 添加項目
   */
  addItem: (item: TimelineItem) => void;
  
  /**
   * 更新項目
   */
  updateItem: (id: string | number, updates: Partial<TimelineItem>) => void;
  
  /**
   * 刪除項目
   */
  removeItem: (id: string | number) => void;
  
  /**
   * 添加群組
   */
  addGroup: (group: TimelineGroup) => void;
  
  /**
   * 更新群組
   */
  updateGroup: (id: string | number, updates: Partial<TimelineGroup>) => void;
  
  /**
   * 刪除群組
   */
  removeGroup: (id: string | number) => void;
  
  /**
   * 設定項目
   */
  setItems: (items: TimelineItem[]) => void;
  
  /**
   * 設定群組
   */
  setGroups: (groups: TimelineGroup[]) => void;
}

/**
 * Timeline 資料處理 Hook
 * @param initialItems 初始項目資料
 * @param initialGroups 初始群組資料
 * @returns Timeline 資料及操作方法
 */
export const useTimelineData = (
  initialItems: TimelineItem[] = [],
  initialGroups: TimelineGroup[] = []
): UseTimelineDataReturn => {
  const [state, setState] = useState<TimelineDataState>({
    items: initialItems,
    groups: initialGroups.length > 0 ? initialGroups : undefined,
    loading: false,
    error: null
  });

  // 設定項目
  const setItems = useCallback((items: TimelineItem[]) => {
    setState(prev => ({ ...prev, items }));
  }, []);

  // 設定群組
  const setGroups = useCallback((groups: TimelineGroup[]) => {
    setState(prev => ({ ...prev, groups }));
  }, []);

  // 添加項目
  const addItem = useCallback((item: TimelineItem) => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
  }, []);

  // 更新項目
  const updateItem = useCallback((id: string | number, updates: Partial<TimelineItem>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        (item.id === id ? { ...item, ...updates } : item)
      )
    }));
  }, []);

  // 刪除項目
  const removeItem = useCallback((id: string | number) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  }, []);

  // 添加群組
  const addGroup = useCallback((group: TimelineGroup) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups ? [...prev.groups, group] : [group]
    }));
  }, []);

  // 更新群組
  const updateGroup = useCallback((id: string | number, updates: Partial<TimelineGroup>) => {
    setState(prev => {
      if (!prev.groups) return prev;
      
      return {
        ...prev,
        groups: prev.groups.map(group => 
          (group.id === id ? { ...group, ...updates } : group)
        )
      };
    });
  }, []);

  // 刪除群組
  const removeGroup = useCallback((id: string | number) => {
    setState(prev => {
      if (!prev.groups) return prev;
      
      return {
        ...prev,
        groups: prev.groups.filter(group => group.id !== id)
      };
    });
  }, []);

  return {
    ...state,
    setItems,
    setGroups,
    addItem,
    updateItem,
    removeItem,
    addGroup,
    updateGroup,
    removeGroup
  };
};
