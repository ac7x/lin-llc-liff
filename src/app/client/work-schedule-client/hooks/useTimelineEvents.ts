/**
 * Timeline 事件處理 Hook
 */

import { useCallback } from 'react';
import { TimelineItem } from '../types/TimelineItem';
import { TimelineGroup } from '../types/TimelineGroup';

interface TimelineEventsOptions {
  /**
   * 選擇項目時的回調
   */
  onSelect?: (items: Array<string | number>) => void;
  
  /**
   * 雙擊項目時的回調
   */
  onDoubleClick?: (item: TimelineItem) => void;
  
  /**
   * 右鍵選單回調
   */
  onContextMenu?: (event: React.MouseEvent, item?: TimelineItem) => void;
  
  /**
   * 點擊時間軸空白處回調
   */
  onClick?: (event: React.MouseEvent, time: Date) => void;
  
  /**
   * 時間軸時間範圍變更回調
   */
  onRangeChanged?: (startDate: Date, endDate: Date) => void;
  
  /**
   * 新增項目回調
   */
  onAdd?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 更新項目回調
   */
  onUpdate?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 移動項目回調
   */
  onMove?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 移動項目中回調
   */
  onMoving?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 刪除項目回調
   */
  onRemove?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 新增群組回調
   */
  onAddGroup?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 移動群組回調
   */
  onMoveGroup?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 刪除群組回調
   */
  onRemoveGroup?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 初次繪製完成回調
   */
  onInitialDrawComplete?: () => void;
}

interface UseTimelineEventsReturn {
  /**
   * 處理選擇項目事件
   */
  handleSelect: (items: Array<string | number>) => void;
  
  /**
   * 處理雙擊項目事件
   */
  handleDoubleClick: (item: TimelineItem) => void;
  
  /**
   * 處理右鍵選單事件
   */
  handleContextMenu: (event: React.MouseEvent, item?: TimelineItem) => void;
  
  /**
   * 處理點擊事件
   */
  handleClick: (event: React.MouseEvent, time: Date) => void;
  
  /**
   * 處理時間範圍變更事件
   */
  handleRangeChanged: (startDate: Date, endDate: Date) => void;
  
  /**
   * 處理新增項目事件
   */
  handleAdd: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理更新項目事件
   */
  handleUpdate: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理移動項目事件
   */
  handleMove: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理移動項目中事件
   */
  handleMoving: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理刪除項目事件
   */
  handleRemove: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理新增群組事件
   */
  handleAddGroup: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 處理移動群組事件
   */
  handleMoveGroup: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 處理刪除群組事件
   */
  handleRemoveGroup: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 處理初次繪製完成事件
   */
  handleInitialDrawComplete: () => void;
  
  /**
   * 取得所有事件處理函數
   */
  getEventHandlers: () => Record<string, any>;
}

/**
 * Timeline 事件處理 Hook
 * @param options 事件選項
 * @returns Timeline 事件處理函數
 */
export const useTimelineEvents = (
  options: TimelineEventsOptions = {}
): UseTimelineEventsReturn => {
  // 選擇項目事件
  const handleSelect = useCallback((items: Array<string | number>) => {
    if (options.onSelect) {
      options.onSelect(items);
    }
  }, [options.onSelect]);

  // 雙擊項目事件
  const handleDoubleClick = useCallback((item: TimelineItem) => {
    if (options.onDoubleClick) {
      options.onDoubleClick(item);
    }
  }, [options.onDoubleClick]);

  // 右鍵選單事件
  const handleContextMenu = useCallback((event: React.MouseEvent, item?: TimelineItem) => {
    if (options.onContextMenu) {
      options.onContextMenu(event, item);
    }
  }, [options.onContextMenu]);

  // 點擊事件
  const handleClick = useCallback((event: React.MouseEvent, time: Date) => {
    if (options.onClick) {
      options.onClick(event, time);
    }
  }, [options.onClick]);

  // 時間範圍變更事件
  const handleRangeChanged = useCallback((startDate: Date, endDate: Date) => {
    if (options.onRangeChanged) {
      options.onRangeChanged(startDate, endDate);
    }
  }, [options.onRangeChanged]);

  // 新增項目事件
  const handleAdd = useCallback((item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
    if (options.onAdd) {
      options.onAdd(item, callback);
    } else {
      callback(item);
    }
  }, [options.onAdd]);

  // 更新項目事件
  const handleUpdate = useCallback((item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
    if (options.onUpdate) {
      options.onUpdate(item, callback);
    } else {
      callback(item);
    }
  }, [options.onUpdate]);

  // 移動項目事件
  const handleMove = useCallback((item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
    if (options.onMove) {
      options.onMove(item, callback);
    } else {
      callback(item);
    }
  }, [options.onMove]);

  // 移動項目中事件
  const handleMoving = useCallback((item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
    if (options.onMoving) {
      options.onMoving(item, callback);
    } else {
      callback(item);
    }
  }, [options.onMoving]);

  // 刪除項目事件
  const handleRemove = useCallback((item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
    if (options.onRemove) {
      options.onRemove(item, callback);
    } else {
      callback(null);
    }
  }, [options.onRemove]);

  // 新增群組事件
  const handleAddGroup = useCallback((group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => {
    if (options.onAddGroup) {
      options.onAddGroup(group, callback);
    } else {
      callback(group);
    }
  }, [options.onAddGroup]);

  // 移動群組事件
  const handleMoveGroup = useCallback((group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => {
    if (options.onMoveGroup) {
      options.onMoveGroup(group, callback);
    } else {
      callback(group);
    }
  }, [options.onMoveGroup]);

  // 刪除群組事件
  const handleRemoveGroup = useCallback((group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => {
    if (options.onRemoveGroup) {
      options.onRemoveGroup(group, callback);
    } else {
      callback(null);
    }
  }, [options.onRemoveGroup]);

  // 初次繪製完成事件
  const handleInitialDrawComplete = useCallback(() => {
    if (options.onInitialDrawComplete) {
      options.onInitialDrawComplete();
    }
  }, [options.onInitialDrawComplete]);

  // 取得所有事件處理函數
  const getEventHandlers = useCallback(() => {
    return {
      select: handleSelect,
      doubleClick: handleDoubleClick,
      contextmenu: handleContextMenu,
      click: handleClick,
      rangechanged: handleRangeChanged,
      add: handleAdd,
      update: handleUpdate,
      move: handleMove,
      moving: handleMoving,
      remove: handleRemove,
      addGroup: handleAddGroup,
      moveGroup: handleMoveGroup,
      removeGroup: handleRemoveGroup,
      initialDrawComplete: handleInitialDrawComplete
    };
  }, [
    handleSelect,
    handleDoubleClick,
    handleContextMenu,
    handleClick,
    handleRangeChanged,
    handleAdd,
    handleUpdate,
    handleMove,
    handleMoving,
    handleRemove,
    handleAddGroup,
    handleMoveGroup,
    handleRemoveGroup,
    handleInitialDrawComplete
  ]);

  return {
    handleSelect,
    handleDoubleClick,
    handleContextMenu,
    handleClick,
    handleRangeChanged,
    handleAdd,
    handleUpdate,
    handleMove,
    handleMoving,
    handleRemove,
    handleAddGroup,
    handleMoveGroup,
    handleRemoveGroup,
    handleInitialDrawComplete,
    getEventHandlers
  };
};
