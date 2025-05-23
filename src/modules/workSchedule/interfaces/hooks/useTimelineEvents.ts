'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline';
import { UpdateWorkTimeUseCase } from '../../application/usecases/UpdateWorkTime';
import { WorkItem } from '../../domain/model/WorkItem';
import { TimelineAdapter } from '../../infrastructure/adapter/TimelineAdapter';

/**
 * Timeline 事件處理 Hook
 * 封裝 vis-timeline 事件邏輯
 */
export interface UseTimelineEventsProps {
    timelineAdapter: TimelineAdapter;
    updateWorkTimeUseCase: UpdateWorkTimeUseCase;
    onItemSelect?: (workItem: WorkItem | null) => void;
    onItemUpdate?: (workItem: WorkItem) => void;
    onItemAdd?: (workItem: WorkItem) => void;
    onItemRemove?: (workItemId: string) => void;
    onError?: (error: string) => void;
}

export interface UseTimelineEventsReturn {
    attachEvents: (timeline: Timeline) => void;
    detachEvents: () => void;
    selectedItem: WorkItem | null;
}

export function useTimelineEvents({
    timelineAdapter,
    updateWorkTimeUseCase,
    onItemSelect,
    onItemUpdate,
    onItemAdd,
    onItemRemove,
    onError
}: UseTimelineEventsProps): UseTimelineEventsReturn {
    const timelineRef = useRef<Timeline | null>(null);
    const selectedItemRef = useRef<WorkItem | null>(null);

    /**
     * 處理項目選擇事件
     */
    const handleSelect = useCallback((properties: any) => {
        const itemsDataSet = timelineAdapter.getItemsDataSet();

        if (properties.items && properties.items.length > 0) {
            const itemId = properties.items[0];
            const timelineItem = itemsDataSet.get(itemId);

            if (timelineItem) {
                // 這裡需要從 timelineItem 轉換回 WorkItem
                // 實際實作時可能需要額外的查詢
                selectedItemRef.current = null; // 暫時設為 null
                onItemSelect?.(selectedItemRef.current);
            }
        } else {
            selectedItemRef.current = null;
            onItemSelect?.(null);
        }
    }, [timelineAdapter, onItemSelect]);

    /**
     * 處理項目移動事件（拖曳更新時間）
     */
    const handleItemMove = useCallback(async (item: any, callback: (item: any) => void) => {
        try {
            const response = await updateWorkTimeUseCase.execute({
                workItemId: item.id,
                newStartTime: new Date(item.start),
                newEndTime: new Date(item.end)
            });

            if (response.success && response.workItem) {
                // 更新成功，接受變更
                callback(item);
                onItemUpdate?.(response.workItem);
            } else {
                // 更新失敗，拒絕變更
                callback(null);
                onError?.(response.error || '更新時間失敗');
            }
        } catch (error) {
            // 發生錯誤，拒絕變更
            callback(null);
            onError?.(error instanceof Error ? error.message : '未知錯誤');
        }
    }, [updateWorkTimeUseCase, onItemUpdate, onError]);

    /**
     * 處理項目新增事件
     */
    const handleItemAdd = useCallback((item: any, callback: (item: any) => void) => {
        // 這裡需要實作新增邏輯
        // 暫時拒絕新增
        callback(null);
    }, [onItemAdd]);

    /**
     * 處理項目移除事件
     */
    const handleItemRemove = useCallback((item: any, callback: (item: any) => void) => {
        // 確認是否要刪除
        if (confirm(`確定要刪除工作項目「${item.content}」嗎？`)) {
            // 接受刪除
            callback(item);
            onItemRemove?.(item.id);
        } else {
            // 取消刪除
            callback(null);
        }
    }, [onItemRemove]);

    /**
     * 處理時間範圍變更事件
     */
    const handleRangeChanged = useCallback((properties: any) => {
        // 可以在這裡處理視窗範圍變更邏輯
        // 例如載入該時間範圍內的資料
    }, []);

    /**
     * 處理點擊事件
     */
    const handleClick = useCallback((properties: any) => {
        // 處理 Timeline 點擊事件
        if (properties.what === 'background') {
            // 點擊背景，清除選擇
            selectedItemRef.current = null;
            onItemSelect?.(null);
        }
    }, [onItemSelect]);

    /**
     * 處理雙擊事件
     */
    const handleDoubleClick = useCallback((properties: any) => {
        // 處理雙擊事件，例如開啟編輯對話框
        if (properties.item) {
            // 雙擊項目
            console.log('Double clicked item:', properties.item);
        } else if (properties.what === 'background') {
            // 雙擊背景，可能要新增項目
            console.log('Double clicked background at:', new Date(properties.time));
        }
    }, []);

    /**
     * 處理內容功能表事件
     */
    const handleContextMenu = useCallback((properties: any) => {
        // 處理右鍵選單
        properties.event.preventDefault();

        if (properties.item) {
            // 右鍵點擊項目
            console.log('Context menu for item:', properties.item);
        } else {
            // 右鍵點擊背景
            console.log('Context menu for background at:', new Date(properties.time));
        }
    }, []);

    /**
     * 附加事件監聽器
     */
    const attachEvents = useCallback((timeline: Timeline) => {
        timelineRef.current = timeline;

        // 選擇事件
        timeline.on('select', handleSelect);

        // 項目操作事件
        timeline.on('itemover', (properties) => {
            // 滑鼠懸停
        });

        timeline.on('itemout', (properties) => {
            // 滑鼠離開
        });

        // 時間範圍變更事件
        timeline.on('rangechanged', handleRangeChanged);

        // 點擊事件
        timeline.on('click', handleClick);
        timeline.on('doubleClick', handleDoubleClick);
        timeline.on('contextmenu', handleContextMenu);

        // 編輯事件（如果啟用編輯功能）
        timeline.on('itemover', (properties) => {
            timeline.setOptions({
                editable: {
                    add: false,
                    updateTime: true,
                    updateGroup: true,
                    remove: true,
                    overrideItems: false
                }
            });
        });

        // 設定項目移動回調
        timeline.setOptions({
            onMove: handleItemMove,
            onAdd: handleItemAdd,
            onRemove: handleItemRemove
        });
    }, [
        handleSelect,
        handleRangeChanged,
        handleClick,
        handleDoubleClick,
        handleContextMenu,
        handleItemMove,
        handleItemAdd,
        handleItemRemove
    ]);

    /**
     * 移除事件監聽器
     */
    const detachEvents = useCallback(() => {
        if (timelineRef.current) {
            timelineRef.current.off('select');
            timelineRef.current.off('itemover');
            timelineRef.current.off('itemout');
            timelineRef.current.off('rangechanged');
            timelineRef.current.off('click');
            timelineRef.current.off('doubleClick');
            timelineRef.current.off('contextmenu');
            timelineRef.current = null;
        }
    }, []);

    /**
     * 清理效果
     */
    useEffect(() => {
        return () => {
            detachEvents();
        };
    }, [detachEvents]);

    return {
        attachEvents,
        detachEvents,
        selectedItem: selectedItemRef.current
    };
}
