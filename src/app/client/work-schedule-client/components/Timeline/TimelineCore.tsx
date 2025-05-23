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
    initialItems: items, 
    initialGroups: groups
  });
  
  // 選項設定
  const { mergedOptions } = useTimelineOptions({
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
    onAdd,
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
  className,
  style,
  itemFilter,
}) => {
  // 建立參照物
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  
  // 資料狀態
  const { 
    items: dataItems, 
    groups: dataGroups,
    setItems,
    addItem,
    updateItem,
    removeItem,
    addGroup,
    updateGroup,
    removeGroup
  } = useTimelineData({ initialItems: items, initialGroups: groups });
  
  // 選項設定
  const { 
    getOptions,
    updateOptions
  } = useTimelineOptions({ initialOptions: { ...DEFAULT_TIMELINE_OPTIONS, ...options }, editable });
  
  // 事件處理
  const { 
    bindTimelineEvents,
    unbindTimelineEvents
  } = useTimelineEvents({
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
  const {
    isEditing,
    toggleEditing,
    enableEditing,
    disableEditing,
    handleItemAdd,
    handleItemUpdate,
    handleItemMove
  } = useTimelineEditing({
    onAdd,
    onUpdate,
    onMove
  });
  
  // 初始化 Timeline
  useEffect(() => {
    if (!containerRef.current) return;
  
    // 建立資料集
    const itemDataSet = new DataSet(
      dataItems.filter(item => !itemFilter || itemFilter(item))
    );
    const groupDataSet = dataGroups?.length ? new DataSet(dataGroups) : undefined;
    
    // 建立時間軸
    timelineRef.current = new VisTimeline(
      containerRef.current,
      itemDataSet,
      groupDataSet,
      getOptions()
    );
    
    // 綁定事件處理器
    bindTimelineEvents(timelineRef.current);
    
    // 清除函數
    return () => {
      if (timelineRef.current) {
        unbindTimelineEvents(timelineRef.current);
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, []);
  
  // 更新項目資料
  useEffect(() => {
    if (!timelineRef.current) return;
    
    const filteredItems = items.filter(item => !itemFilter || itemFilter(item));
    const itemDataSet = new DataSet(filteredItems);
    
    timelineRef.current.setItems(itemDataSet);
    setItems(filteredItems);
  }, [items, itemFilter]);
  
  // 更新群組資料
  useEffect(() => {
    if (!timelineRef.current) return;
    
    if (groups?.length) {
      const groupDataSet = new DataSet(groups);
      timelineRef.current.setGroups(groupDataSet);
    }
  }, [groups]);
  
  // 更新選項設定
  useEffect(() => {
    if (!timelineRef.current) return;
    
    const combinedOptions = { ...DEFAULT_TIMELINE_OPTIONS, ...options };
    if (editable !== undefined) {
      combinedOptions.editable = editable;
    }
    
    updateOptions(combinedOptions);
    timelineRef.current.setOptions(combinedOptions);
  }, [options, editable]);
  
  return (
    <div 
      ref={containerRef} 
      className={`timeline-container ${className || ''}`}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
};

export default TimelineCore;
   */
  onRemoveGroup?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;
  
  /**
   * 語系設定
   */
  locale?: string;
  
  /**
   * 是否使用 UTC 時間
   */
  useUtc?: boolean;
  
  /**
   * 初始化完成回調
   */
  onInitialized?: () => void;
  
  /**
   * 自訂類別名稱
   */
  className?: string;
  
  /**
   * 自訂樣式
   */
  style?: React.CSSProperties;
}

/**
 * Timeline 核心元件
 */
const Timeline: React.FC<TimelineProps> = ({
  items: initialItems = [],
  groups: initialGroups = [],
  options: initialOptions = {},
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
  locale,
  useUtc = false,
  onInitialized,
  className = '',
  style = {}
}) => {
  // 容器參考
  const containerRef = useRef<HTMLDivElement>(null);
  // Timeline 實例參考
  const timelineRef = useRef<any>(null);
  // 項目資料集參考
  const itemsDatasetRef = useRef<any>(null);
  // 群組資料集參考
  const groupsDatasetRef = useRef<any>(null);
  // 初始化狀態
  const [initialized, setInitialized] = useState<boolean>(false);

  // 使用 Timeline 資料 Hook
  const { 
    items, 
    groups, 
    setItems, 
    setGroups, 
    addItem, 
    updateItem, 
    removeItem, 
    addGroup, 
    updateGroup, 
    removeGroup 
  } = useTimelineData(initialItems, initialGroups);

  // 使用 Timeline 編輯 Hook
  const {
    isEditing, 
    toggleEditing,
    getEditingOptions,
    handleItemAdd,
    handleItemUpdate,
    handleItemMove,
    handleItemRemove,
    handleGroupAdd,
    handleGroupMove,
    handleGroupRemove
  } = useTimelineEditing({
    defaultEditing: editable,
    onItemAdd: onAdd,
    onItemUpdate: onUpdate,
    onItemMove: onMove,
    onItemRemove: onRemove,
    onGroupAdd: onAddGroup,
    onGroupMove: onMoveGroup,
    onGroupRemove: onRemoveGroup
  });

  // 使用 Timeline 事件 Hook
  const {
    handleSelect: onSelectHandler,
    handleDoubleClick: onDoubleClickHandler,
    handleContextMenu: onContextMenuHandler,
    handleClick: onClickHandler,
    handleRangeChanged: onRangeChangedHandler,
    handleAdd: onAddHandler,
    handleUpdate: onUpdateHandler,
    handleMove: onMoveHandler,
    handleMoving: onMovingHandler,
    handleRemove: onRemoveHandler,
    handleAddGroup: onAddGroupHandler,
    handleMoveGroup: onMoveGroupHandler,
    handleRemoveGroup: onRemoveGroupHandler,
    handleInitialDrawComplete: onInitialDrawCompleteHandler,
    getEventHandlers
  } = useTimelineEvents({
    onSelect,
    onDoubleClick,
    onContextMenu,
    onClick,
    onRangeChanged,
    onAdd: handleItemAdd,
    onUpdate: handleItemUpdate,
    onMove: handleItemMove,
    onMoving,
    onRemove: handleItemRemove,
    onAddGroup: handleGroupAdd,
    onMoveGroup: handleGroupMove,
    onRemoveGroup: handleGroupRemove,
    onInitialDrawComplete: () => {
      setInitialized(true);
      if (onInitialized) {
        onInitialized();
      }
    }
  });

  // 使用 Timeline 選項 Hook
  const { options: timelineOptions } = useTimelineOptions({
    initialOptions: {
      ...DEFAULT_TIMELINE_OPTIONS,
      ...initialOptions,
      ...getEditingOptions()
    },
    locale,
    useUtc
  });

  // 初始化 Timeline
  useEffect(() => {
    if (!containerRef.current) return;

    // 模擬 vis-timeline 的 DataSet
    // 實際開發時應使用 vis-timeline 的真實 DataSet
    const createMockDataSet = (data: any[]) => {
      return {
        _data: [...data],
        get: function(id?: any) {
          if (id === undefined) {
            return this._data;
          }
          return this._data.find((item: any) => item.id === id) || null;
        },
        getIds: function() {
          return this._data.map((item: any) => item.id);
        },
        add: function(item: any) {
          this._data.push(item);
          return item.id;
        },
        update: function(item: any) {
          const index = this._data.findIndex((i: any) => i.id === item.id);
          if (index !== -1) {
            this._data[index] = { ...this._data[index], ...item };
          }
          return item.id;
        },
        remove: function(id: any) {
          const index = this._data.findIndex((i: any) => i.id === id);
          if (index !== -1) {
            this._data.splice(index, 1);
          }
          return id;
        },
        on: function(event: string, callback: Function) {
          // 模擬事件監聽
        },
        off: function(event: string, callback: Function) {
          // 模擬移除事件監聽
        }
      };
    };

    // 建立資料集
    itemsDatasetRef.current = createMockDataSet(items);
    groupsDatasetRef.current = createMockDataSet(groups);

    // 建立 mock Timeline (實際應使用 vis-timeline)
    /*
    timelineRef.current = new VisTimeline(
      containerRef.current,
      itemsDatasetRef.current,
      groupsDatasetRef.current,
      timelineOptions
    );
    */

    // 模擬 Timeline 建立
    timelineRef.current = {
      on: (event: string, callback: Function) => {
        // 模擬事件監聽
      },
      off: (event: string, callback: Function) => {
        // 模擬移除事件監聽
      },
      setOptions: (options: any) => {
        // 模擬設定選項
      },
      setItems: (items: any) => {
        // 模擬設定項目
      },
      setGroups: (groups: any) => {
        // 模擬設定群組
      },
      setWindow: (start: Date, end: Date, options?: any) => {
        // 模擬設定視窗範圍
      },
      getWindow: () => {
        // 模擬取得視窗範圍
        return { start: new Date(), end: new Date() };
      },
      fit: (options?: any) => {
        // 模擬調整視窗以符合所有項目
      },
      moveTo: (time: Date, options?: any) => {
        // 模擬移動到特定時間
      },
      getSelectedItems: () => {
        // 模擬取得選取的項目
        return [];
      },
      getSelection: () => {
        // 模擬取得選取的項目 ID
        return [];
      },
      setSelection: (ids: any, options?: any) => {
        // 模擬設定選取的項目
      },
      focus: (id: any, options?: any) => {
        // 模擬聚焦特定項目
      },
      destroy: () => {
        // 模擬銷毀 Timeline
      }
    };

    // 註冊事件監聽器
    const eventHandlers = getEventHandlers();
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (timelineRef.current) {
        timelineRef.current.on(event, handler);
      }
    });

    // 設定初始化完成
    setInitialized(true);
    if (onInitialized) {
      onInitialized();
    }

    // 清理函數
    return () => {
      // 移除事件監聽器
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        if (timelineRef.current) {
          timelineRef.current.off(event, handler);
        }
      });

      // 銷毀 Timeline
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, []); // 只在元件掛載時執行一次

  // 當項目資料變更時更新 Timeline
  useEffect(() => {
    if (timelineRef.current && itemsDatasetRef.current) {
      // 實際應使用 DataSet.update
      // itemsDatasetRef.current.clear();
      // items.forEach(item => itemsDatasetRef.current.add(item));
      
      // 或使用 setItems
      timelineRef.current.setItems(items);
    }
  }, [items]);

  // 當群組資料變更時更新 Timeline
  useEffect(() => {
    if (timelineRef.current && groupsDatasetRef.current) {
      // 實際應使用 DataSet.update
      // groupsDatasetRef.current.clear();
      // groups.forEach(group => groupsDatasetRef.current.add(group));
      
      // 或使用 setGroups
      timelineRef.current.setGroups(groups);
    }
  }, [groups]);

  // 當選項變更時更新 Timeline
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.setOptions({
        ...timelineOptions,
        ...getEditingOptions()
      });
    }
  }, [timelineOptions, isEditing]);

  // 當編輯狀態變更時更新選項
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.setOptions({
        ...timelineOptions,
        ...getEditingOptions()
      });
    }
  }, [isEditing]);

  // 接收外部傳入的項目資料變更
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // 接收外部傳入的群組資料變更
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  return (
    <div
      ref={containerRef}
      className={`timeline-container ${className}`}
      style={{
        ...style,
        width: '100%',
        height: '400px'
      }}
    />
  );
};

export default Timeline;
