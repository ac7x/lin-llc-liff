/**
 * Timeline 核心實作元件
 */

import React, { useRef, useEffect } from 'react';
import { TimelineItem } from '../../types/TimelineItem';
import { TimelineGroup } from '../../types/TimelineGroup';
import { TimelineOptions } from '../../types/TimelineOptions';
import { useTimelineData } from '../../hooks/useTimelineData';
import { useTimelineEvents } from '../../hooks/useTimelineEvents';
import { useTimelineOptions } from '../../hooks/useTimelineOptions';
import { useTimelineEditing } from '../../hooks/useTimelineEditing';
import { DEFAULT_TIMELINE_OPTIONS } from '../../constants';

// 引入 vis-timeline 函式庫
import { Timeline as VisTimeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

interface TimelineProps {
  /**
   * 項目資料
   */
  items?: TimelineItem[];
  
  /**
   * 群組資料
   */
  groups?: TimelineGroup[];
  
  /**
   * Timeline 選項
   */
  options?: Partial<TimelineOptions>;
  
  /**
   * 是否可編輯
   */
  editable?: boolean;
  
  /**
   * 選擇項目回調
   */
  onSelect?: (items: Array<string | number>) => void;
  
  /**
   * 雙擊項目回調
   */
  onDoubleClick?: (item: TimelineItem) => void;
  
  /**
   * 右鍵選單回調
   */
  onContextMenu?: (event: React.MouseEvent, item?: TimelineItem) => void;
  
  /**
   * 點擊時間軸回調
   */
  onClick?: (event: React.MouseEvent, time: Date) => void;
  
  /**
   * 時間範圍變更回調
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
   * 自訂渲染器
   */
  customRenderer?: (item: TimelineItem, element: HTMLElement) => void;
  
  /**
   * 元件類別名稱
   */
  className?: string;
  
  /**
   * 元件樣式
   */
  style?: React.CSSProperties;
  
  /**
   * 項目過濾器
   */
  itemFilter?: (item: TimelineItem) => boolean;
}

/**
 * Timeline 核心元件
 */
export const TimelineCore: React.FC<TimelineProps> = ({
  items = [],
  groups = [],
  options = {},
  editable = false,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onClick,
  onRangeChanged,
  onAdd,
  onUpdate,
  onMove,
  onMoving,
  onRemove,
  onAddGroup,
  onMoveGroup,
  onRemoveGroup,
  customRenderer,
  className = '',
  style = {},
  itemFilter,
}) => {
  // 建立參照物
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  
  // 資料狀態
  const { 
    items: dataItems, 
    groups: dataGroups,
    setItems
  } = useTimelineData({
    initialGroups: groups
  });
  
  // 選項設定
  const { options: mergedOptions } = useTimelineOptions({
    initialOptions: { ...DEFAULT_TIMELINE_OPTIONS, ...options, editable }
  });
  
  // 事件處理
  const eventHandlers = useTimelineEvents({
    onSelect,
    onDoubleClick,
    onContextMenu,
    onClick,
    onRangeChanged,
    onAdd,
    onUpdate,
    onMove,
    onMoving,
    onRemove,
    onAddGroup,
    onMoveGroup,
    onRemoveGroup
  });
  
  // 編輯功能
  useTimelineEditing({
    onUpdate,
    onMove
  });
  
  // 初始化 Timeline
  useEffect(() => {
    if (!containerRef.current) return;
  
    // 建立資料集
    const filteredItems = dataItems.filter(item => !itemFilter || itemFilter(item));
    const itemDataSet = new DataSet(filteredItems);
    const groupDataSet = dataGroups?.length ? new DataSet(dataGroups) : undefined;
    
    // 建立時間軸
    timelineRef.current = new VisTimeline(
      containerRef.current,
      itemDataSet,
      groupDataSet,
      mergedOptions
    );
    
    // 綁定事件處理器
    if (timelineRef.current) {
      // 綁定選擇事件
      if (onSelect) {
        timelineRef.current.on('select', ({ items: selectedItems }) => {
          onSelect(selectedItems);
        });
      }
      
      // 綁定雙擊事件
      if (onDoubleClick) {
        timelineRef.current.on('doubleClick', ({ item, event }) => {
          if (item) {
            const selectedItem = filteredItems.find(i => i.id === item);
            if (selectedItem) {
              onDoubleClick(selectedItem);
            }
          }
        });
      }

      // 綁定項目移動事件
      if (onMove) {
        timelineRef.current.on('move', ({ item, group, start, end }) => {
          const selectedItem = filteredItems.find(i => i.id === item);
          if (selectedItem) {
            const updatedItem = {
              ...selectedItem,
              start,
              end,
              group
            };
            onMove(updatedItem, (resultItem) => {
              if (resultItem) {
                updateItemInDataSet(itemDataSet, resultItem);
              }
            });
          }
        });
      }
      
      // 綁定其他事件...
    }
    
    // 清除函數
    return () => {
      if (timelineRef.current) {
        // 清除事件綁定
        timelineRef.current.off('select');
        timelineRef.current.off('doubleClick');
        timelineRef.current.off('move');
        // 清除其他事件...
        
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, []);
  
  // 更新項目資料
  useEffect(() => {
    if (!timelineRef.current) return;
    
    const filteredItems = items.filter(item => !itemFilter || itemFilter(item));
    setItems(filteredItems);
    
    const itemDataSet = new DataSet(filteredItems);
    timelineRef.current.setItems(itemDataSet);
  }, [items, itemFilter, setItems]);
  
  // 更新群組資料
  useEffect(() => {
    if (!timelineRef.current || !groups?.length) return;
    
    const groupDataSet = new DataSet(groups);
    timelineRef.current.setGroups(groupDataSet);
  }, [groups]);
  
  // 更新選項設定
  useEffect(() => {
    if (!timelineRef.current) return;
    
    const updatedOptions = { 
      ...DEFAULT_TIMELINE_OPTIONS, 
      ...options,
      editable
    };
    
    timelineRef.current.setOptions(updatedOptions);
  }, [options, editable]);
  
  // 輔助函數：更新資料集中的項目
  const updateItemInDataSet = (dataSet: DataSet<any>, item: TimelineItem) => {
    dataSet.update({
      id: item.id,
      group: item.group,
      content: item.content,
      start: item.start,
      end: item.end,
      type: item.type,
      className: item.className
    });
  };
  
  return (
    <div 
      ref={containerRef} 
      className={`timeline-container ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
};

export default TimelineCore;
