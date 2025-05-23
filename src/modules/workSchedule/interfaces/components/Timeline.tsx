'use client';

import { useEffect, useRef, useState } from 'react';
import { Timeline as VisTimeline } from 'vis-timeline';
import { TimelineConfigDTO, TimelineGroupDTO } from '../../application/dto/WorkItemDTO';
import { UpdateWorkTimeUseCase } from '../../application/usecases/UpdateWorkTime';
import { WorkItem } from '../../domain/model/WorkItem';
import { TimelineAdapter } from '../../infrastructure/adapter/TimelineAdapter';
import { useTimelineEvents } from '../hooks/useTimelineEvents';

/**
 * Timeline 組件屬性
 */
export interface TimelineProps {
    workItems: WorkItem[];
    config?: TimelineConfigDTO;
    groups?: TimelineGroupDTO[];
    onUpdateWorkTime: (id: string, startTime: Date, endTime: Date) => Promise<void>;
    className?: string;
    style?: React.CSSProperties;
    onItemSelect?: (workItem: WorkItem | null) => void;
    onItemUpdate?: (workItem: WorkItem) => void;
    onItemAdd?: (workItem: WorkItem) => void;
    onItemRemove?: (workItemId: string) => void;
    onError?: (error: string) => void;
    onReady?: (timeline: VisTimeline) => void;
}

/**
 * Timeline 組件容器
 * 使用 vis-timeline 顯示工作排程
 */
export function Timeline({
    workItems,
    config = {},
    groups,
    onUpdateWorkTime,
    className = '',
    style,
    onItemSelect,
    onItemUpdate,
    onItemAdd,
    onItemRemove,
    onError,
    onReady
}: TimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineAdapterRef = useRef<TimelineAdapter>(new TimelineAdapter());
    const [timeline, setTimeline] = useState<VisTimeline | null>(null);
    const [isReady, setIsReady] = useState(false);

    // 事件處理 Hook
    const { attachEvents, detachEvents, selectedItem } = useTimelineEvents({
        timelineAdapter: timelineAdapterRef.current,
        updateWorkTimeUseCase,
        onItemSelect,
        onItemUpdate,
        onItemAdd,
        onItemRemove,
        onError
    });

    /**
     * 初始化 Timeline
     */
    useEffect(() => {
        if (!containerRef.current || timeline) return;

        try {
            // 建立 Timeline 實例
            const newTimeline = timelineAdapterRef.current.initializeTimeline(
                containerRef.current,
                {
                    orientation: 'top',
                    stack: true,
                    showCurrentTime: true,
                    editable: true,
                    selectable: true,
                    zoomable: true,
                    moveable: true,
                    ...config
                }
            );

            // 附加事件處理器
            attachEvents(newTimeline);

            setTimeline(newTimeline);
            setIsReady(true);
            onReady?.(newTimeline);
        } catch (error) {
            console.error('Failed to initialize timeline:', error);
            onError?.(error instanceof Error ? error.message : 'Timeline 初始化失敗');
        }

        // 清理函式
        return () => {
            if (timeline) {
                detachEvents();
                timelineAdapterRef.current.destroy();
                setTimeline(null);
                setIsReady(false);
            }
        };
    }, [config, attachEvents, detachEvents, onReady, onError]);

    /**
     * 載入工作項目資料
     */
    useEffect(() => {
        if (!isReady || !workItems) return;

        try {
            timelineAdapterRef.current.loadWorkItems(workItems);

            // 如果沒有提供群組，則根據工作項目建立群組
            if (!groups) {
                const autoGroups = timelineAdapterRef.current.createGroupsFromWorkItems(workItems);
                timelineAdapterRef.current.setGroups(autoGroups);
            }
        } catch (error) {
            console.error('Failed to load work items:', error);
            onError?.(error instanceof Error ? error.message : '載入工作項目失敗');
        }
    }, [workItems, isReady, groups, onError]);

    /**
     * 載入群組資料
     */
    useEffect(() => {
        if (!isReady || !groups) return;

        try {
            timelineAdapterRef.current.setGroups(groups);
        } catch (error) {
            console.error('Failed to load groups:', error);
            onError?.(error instanceof Error ? error.message : '載入群組失敗');
        }
    }, [groups, isReady, onError]);

    /**
     * 聚焦到今天
     */
    const focusToday = () => {
        if (!timeline) return;

        const now = new Date();
        const start = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12小時前
        const end = new Date(now.getTime() + 12 * 60 * 60 * 1000);   // 12小時後

        timelineAdapterRef.current.setWindow(start, end);
    };

    /**
     * 聚焦到特定項目
     */
    const focusOnItem = (itemId: string) => {
        timelineAdapterRef.current.focusOnItem(itemId);
    };

    /**
     * 設定時間視窗
     */
    const setWindow = (start: Date, end: Date) => {
        timelineAdapterRef.current.setWindow(start, end);
    };

    /**
     * 取得目前選中的項目
     */
    const getSelectedItem = () => {
        return selectedItem;
    };

    // 將方法暴露給父組件
    useEffect(() => {
        if (timeline && onReady) {
            // 可以通過 ref 或其他方式暴露方法
            (timeline as any).focusToday = focusToday;
            (timeline as any).focusOnItem = focusOnItem;
            (timeline as any).setWindow = setWindow;
            (timeline as any).getSelectedItem = getSelectedItem;
        }
    }, [timeline, onReady]);

    return (
        <div className="timeline-container">
            {/* Timeline 容器 */}
            <div
                ref={containerRef}
                className={`timeline-vis ${className}`}
                style={{
                    width: '100%',
                    height: '400px',
                    border: '1px solid #ccc',
                    ...style
                }}
            />

            {/* 載入狀態 */}
            {!isReady && (
                <div className="timeline-loading">
                    <div className="loading-spinner">載入中...</div>
                </div>
            )}

            {/* 工具列（可選） */}
            {isReady && (
                <div className="timeline-toolbar">
                    <button
                        type="button"
                        onClick={focusToday}
                        className="btn btn-sm btn-outline-primary"
                    >
                        回到今天
                    </button>

                    {selectedItem && (
                        <div className="selected-item-info">
                            已選擇：{selectedItem.title}
                        </div>
                    )}
                </div>
            )}

            {/* 錯誤訊息 */}
            {!isReady && (
                <div className="timeline-error">
                    Timeline 初始化失敗，請重新載入頁面
                </div>
            )}
        </div>
    );
}

export default Timeline;
