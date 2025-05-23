'use client';

import { useState } from 'react';
import { WorkItemPriority, WorkItemStatus, WorkItemType } from '../../domain/model/WorkItem';

/**
 * 工具列組件屬性
 */
export interface ToolbarProps {
    onViewModeChange?: (mode: ViewMode) => void;
    onFilterChange?: (filters: TimelineFilters) => void;
    onTimeRangeChange?: (start: Date, end: Date) => void;
    onCreateItem?: () => void;
    onRefresh?: () => void;
    className?: string;
    disabled?: boolean;
}

/**
 * 視圖模式
 */
export enum ViewMode {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year'
}

/**
 * Timeline 篩選條件
 */
export interface TimelineFilters {
    status?: WorkItemStatus[];
    type?: WorkItemType[];
    priority?: WorkItemPriority[];
    assigneeId?: string[];
    tags?: string[];
    searchText?: string;
}

/**
 * 工具列組件
 * 提供 Timeline 的控制功能
 */
export function Toolbar({
    onViewModeChange,
    onFilterChange,
    onTimeRangeChange,
    onCreateItem,
    onRefresh,
    className = '',
    disabled = false
}: ToolbarProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WEEK);
    const [filters, setFilters] = useState<TimelineFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [timeRange, setTimeRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)    // 7天後
    });

    /**
     * 處理視圖模式變更
     */
    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        onViewModeChange?.(mode);

        // 根據視圖模式調整時間範圍
        const now = new Date();
        let start: Date, end: Date;

        switch (mode) {
            case ViewMode.DAY:
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case ViewMode.WEEK:
                const dayOfWeek = now.getDay();
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 7);
                break;
            case ViewMode.MONTH:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case ViewMode.YEAR:
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear() + 1, 0, 1);
                break;
        }

        setTimeRange({ start, end });
        onTimeRangeChange?.(start, end);
    };

    /**
     * 處理篩選條件變更
     */
    const handleFilterChange = (newFilters: Partial<TimelineFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        onFilterChange?.(updatedFilters);
    };

    /**
     * 清除所有篩選條件
     */
    const clearFilters = () => {
        const emptyFilters: TimelineFilters = {};
        setFilters(emptyFilters);
        onFilterChange?.(emptyFilters);
    };

    /**
     * 導航到今天
     */
    const navigateToToday = () => {
        handleViewModeChange(viewMode); // 重新計算以今天為中心的時間範圍
    };

    /**
     * 導航到上一個時間段
     */
    const navigatePrevious = () => {
        let newStart: Date, newEnd: Date;
        const diffMs = timeRange.end.getTime() - timeRange.start.getTime();

        newStart = new Date(timeRange.start.getTime() - diffMs);
        newEnd = new Date(timeRange.end.getTime() - diffMs);

        setTimeRange({ start: newStart, end: newEnd });
        onTimeRangeChange?.(newStart, newEnd);
    };

    /**
     * 導航到下一個時間段
     */
    const navigateNext = () => {
        let newStart: Date, newEnd: Date;
        const diffMs = timeRange.end.getTime() - timeRange.start.getTime();

        newStart = new Date(timeRange.start.getTime() + diffMs);
        newEnd = new Date(timeRange.end.getTime() + diffMs);

        setTimeRange({ start: newStart, end: newEnd });
        onTimeRangeChange?.(newStart, newEnd);
    };

    return (
        <div className={`timeline-toolbar ${className}`}>
            {/* 主要工具列 */}
            <div className="toolbar-main">
                {/* 左側：操作按鈕 */}
                <div className="toolbar-left">
                    <button
                        type="button"
                        onClick={onCreateItem}
                        disabled={disabled}
                        className="btn btn-primary btn-sm"
                        title="新增工作項目"
                    >
                        <i className="icon-plus"></i>
                        新增
                    </button>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={disabled}
                        className="btn btn-outline-secondary btn-sm"
                        title="重新整理"
                    >
                        <i className="icon-refresh"></i>
                        重新整理
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn btn-outline-secondary btn-sm ${showFilters ? 'active' : ''}`}
                        title="篩選"
                    >
                        <i className="icon-filter"></i>
                        篩選
                    </button>
                </div>

                {/* 中間：導航控制 */}
                <div className="toolbar-center">
                    <div className="nav-controls">
                        <button
                            type="button"
                            onClick={navigatePrevious}
                            disabled={disabled}
                            className="btn btn-outline-secondary btn-sm"
                            title="上一個"
                        >
                            <i className="icon-chevron-left"></i>
                        </button>

                        <button
                            type="button"
                            onClick={navigateToToday}
                            disabled={disabled}
                            className="btn btn-outline-primary btn-sm"
                            title="回到今天"
                        >
                            今天
                        </button>

                        <button
                            type="button"
                            onClick={navigateNext}
                            disabled={disabled}
                            className="btn btn-outline-secondary btn-sm"
                            title="下一個"
                        >
                            <i className="icon-chevron-right"></i>
                        </button>
                    </div>

                    <div className="time-range-display">
                        {timeRange.start.toLocaleDateString()} - {timeRange.end.toLocaleDateString()}
                    </div>
                </div>

                {/* 右側：視圖模式 */}
                <div className="toolbar-right">
                    <div className="view-mode-selector">
                        {Object.values(ViewMode).map(mode => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => handleViewModeChange(mode)}
                                disabled={disabled}
                                className={`btn btn-sm ${viewMode === mode ? 'btn-primary' : 'btn-outline-secondary'}`}
                                title={`${mode} 視圖`}
                            >
                                {mode === ViewMode.DAY && '日'}
                                {mode === ViewMode.WEEK && '週'}
                                {mode === ViewMode.MONTH && '月'}
                                {mode === ViewMode.YEAR && '年'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 篩選面板 */}
            {showFilters && (
                <div className="toolbar-filters">
                    <div className="filters-row">
                        {/* 狀態篩選 */}
                        <div className="filter-group">
                            <label>狀態：</label>
                            <select
                                multiple
                                value={filters.status || []}
                                onChange={(e) => {
                                    const selectedValues = Array.from(e.target.selectedOptions, option => option.value as WorkItemStatus);
                                    handleFilterChange({ status: selectedValues });
                                }}
                                className="form-select form-select-sm"
                            >
                                <option value={WorkItemStatus.PLANNED}>已規劃</option>
                                <option value={WorkItemStatus.IN_PROGRESS}>進行中</option>
                                <option value={WorkItemStatus.COMPLETED}>已完成</option>
                                <option value={WorkItemStatus.CANCELLED}>已取消</option>
                                <option value={WorkItemStatus.OVERDUE}>逾期</option>
                            </select>
                        </div>

                        {/* 類型篩選 */}
                        <div className="filter-group">
                            <label>類型：</label>
                            <select
                                multiple
                                value={filters.type || []}
                                onChange={(e) => {
                                    const selectedValues = Array.from(e.target.selectedOptions, option => option.value as WorkItemType);
                                    handleFilterChange({ type: selectedValues });
                                }}
                                className="form-select form-select-sm"
                            >
                                <option value={WorkItemType.TASK}>任務</option>
                                <option value={WorkItemType.MEETING}>會議</option>
                                <option value={WorkItemType.BREAK}>休息</option>
                                <option value={WorkItemType.PROJECT}>專案</option>
                                <option value={WorkItemType.MAINTENANCE}>維護</option>
                            </select>
                        </div>

                        {/* 優先級篩選 */}
                        <div className="filter-group">
                            <label>優先級：</label>
                            <select
                                multiple
                                value={filters.priority || []}
                                onChange={(e) => {
                                    const selectedValues = Array.from(e.target.selectedOptions, option => option.value as WorkItemPriority);
                                    handleFilterChange({ priority: selectedValues });
                                }}
                                className="form-select form-select-sm"
                            >
                                <option value={WorkItemPriority.LOW}>低</option>
                                <option value={WorkItemPriority.MEDIUM}>中</option>
                                <option value={WorkItemPriority.HIGH}>高</option>
                                <option value={WorkItemPriority.URGENT}>緊急</option>
                            </select>
                        </div>

                        {/* 搜尋文字 */}
                        <div className="filter-group">
                            <label>搜尋：</label>
                            <input
                                type="text"
                                value={filters.searchText || ''}
                                onChange={(e) => handleFilterChange({ searchText: e.target.value })}
                                placeholder="搜尋標題或描述..."
                                className="form-control form-control-sm"
                            />
                        </div>

                        {/* 清除按鈕 */}
                        <div className="filter-group">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="btn btn-outline-danger btn-sm"
                                title="清除所有篩選"
                            >
                                清除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Toolbar;
