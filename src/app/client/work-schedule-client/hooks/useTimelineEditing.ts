/**
 * Timeline 編輯功能 Hook
 */

import { useState, useCallback } from 'react';
import { TimelineItem } from '../types/TimelineItem';
import { TimelineGroup } from '../types/TimelineGroup';
import { TimelineOptions } from '../types/TimelineOptions';

interface UseTimelineEditingReturn {
  /**
   * 目前是否處於編輯模式
   */
  isEditing: boolean;
  
  /**
   * 切換編輯模式
   */
  toggleEditing: () => void;
  
  /**
   * 啟用編輯模式
   */
  enableEditing: () => void;
  
  /**
   * 停用編輯模式
   */
  disableEditing: () => void;
  
  /**
   * 取得編輯選項設定
   */
  getEditingOptions: () => Partial<TimelineOptions>;
  
  /**
   * 處理新增項目
   */
  handleItemAdd: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理更新項目
   */
  handleItemUpdate: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理移動項目
   */
  handleItemMove: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理刪除項目
   */
  handleItemRemove: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理新增群組
   */
  handleGroupAdd: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 處理移動群組
   */
  handleGroupMove: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 處理刪除群組
   */
  handleGroupRemove: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
}

interface UseTimelineEditingProps {
  /**
   * 處理新增項目的自訂回調
   */
  onItemAdd?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理更新項目的自訂回調
   */
  onItemUpdate?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理移動項目的自訂回調
   */
  onItemMove?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理刪除項目的自訂回調
   */
  onItemRemove?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
  
  /**
   * 處理新增群組的自訂回調
   */
  onGroupAdd?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 處理移動群組的自訂回調
   */
  onGroupMove?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 處理刪除群組的自訂回調
   */
  onGroupRemove?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 初始編輯模式狀態
   */
  defaultEditing?: boolean;
}

/**
 * Timeline 編輯功能 Hook
 * @param props Hook 選項
 * @returns Timeline 編輯相關函數和狀態
 */
export const useTimelineEditing = (
  props: UseTimelineEditingProps = {}
): UseTimelineEditingReturn => {
  // 編輯模式狀態
  const [isEditing, setIsEditing] = useState<boolean>(props.defaultEditing || false);

  // 切換編輯模式
  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  // 啟用編輯模式
  const enableEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  // 停用編輯模式
  const disableEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 取得編輯選項設定
  const getEditingOptions = useCallback((): Partial<TimelineOptions> => {
    if (!isEditing) {
      return {
        editable: false
      };
    }

    return {
      editable: {
        add: true,
        updateTime: true,
        updateGroup: true,
        remove: true,
        overrideItems: false
      },
      groupEditable: {
        add: true,
        remove: true,
        order: true
      }
    };
  }, [isEditing]);

  // 處理新增項目
  const handleItemAdd = useCallback(
    (item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
      if (props.onItemAdd) {
        props.onItemAdd(item, callback);
      } else {
        // 預設行為：接受添加
        callback(item);
      }
    },
    [props.onItemAdd]
  );

  // 處理更新項目
  const handleItemUpdate = useCallback(
    (item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
      if (props.onItemUpdate) {
        props.onItemUpdate(item, callback);
      } else {
        // 預設行為：接受更新
        callback(item);
      }
    },
    [props.onItemUpdate]
  );

  // 處理移動項目
  const handleItemMove = useCallback(
    (item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
      if (props.onItemMove) {
        props.onItemMove(item, callback);
      } else {
        // 預設行為：接受移動
        callback(item);
      }
    },
    [props.onItemMove]
  );

  // 處理刪除項目
  const handleItemRemove = useCallback(
    (item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
      if (props.onItemRemove) {
        props.onItemRemove(item, callback);
      } else {
        // 預設行為：確認刪除
        const confirmDelete = window.confirm('確定要刪除此項目嗎？');
        if (confirmDelete) {
          callback(item);
        } else {
          callback(null);
        }
      }
    },
    [props.onItemRemove]
  );

  // 處理新增群組
  const handleGroupAdd = useCallback(
    (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => {
      if (props.onGroupAdd) {
        props.onGroupAdd(group, callback);
      } else {
        // 預設行為：接受添加
        callback(group);
      }
    },
    [props.onGroupAdd]
  );

  // 處理移動群組
  const handleGroupMove = useCallback(
    (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => {
      if (props.onGroupMove) {
        props.onGroupMove(group, callback);
      } else {
        // 預設行為：接受移動
        callback(group);
      }
    },
    [props.onGroupMove]
  );

  // 處理刪除群組
  const handleGroupRemove = useCallback(
    (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => {
      if (props.onGroupRemove) {
        props.onGroupRemove(group, callback);
      } else {
        // 預設行為：確認刪除
        const confirmDelete = window.confirm('確定要刪除此群組嗎？');
        if (confirmDelete) {
          callback(group);
        } else {
          callback(null);
        }
      }
    },
    [props.onGroupRemove]
  );

  return {
    isEditing,
    toggleEditing,
    enableEditing,
    disableEditing,
    getEditingOptions,
    handleItemAdd,
    handleItemUpdate,
    handleItemMove,
    handleItemRemove,
    handleGroupAdd,
    handleGroupMove,
    handleGroupRemove
  };
};
