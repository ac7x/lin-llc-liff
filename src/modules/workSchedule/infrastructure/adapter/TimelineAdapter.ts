import { DataSet } from 'vis-data';
import { Timeline, TimelineOptions } from 'vis-timeline';
import { TimelineConfigDTO, TimelineGroupDTO, TimelineItemDTO } from '../../application/dto/WorkItemDTO';
import { WorkItem, WorkItemStatus, WorkItemType } from '../../domain/model/WorkItem';

/**
 * Timeline 介面卡 - 將 domain 物件映射到 vis-timeline
 * 負責處理資料格式轉換和 vis-timeline 整合
 */
export class TimelineAdapter {
    private timeline: Timeline | null = null;
    private itemsDataSet: DataSet<TimelineItemDTO>;
    private groupsDataSet: DataSet<TimelineGroupDTO>;

    constructor() {
        this.itemsDataSet = new DataSet<TimelineItemDTO>();
        this.groupsDataSet = new DataSet<TimelineGroupDTO>();
    }

    /**
     * 初始化 Timeline 組件
     */
    initializeTimeline(
        container: HTMLElement,
        config: TimelineConfigDTO = {}
    ): Timeline {
        const options: TimelineOptions = this.convertConfigToOptions(config);

        this.timeline = new Timeline(
            container,
            this.itemsDataSet,
            this.groupsDataSet,
            options
        );

        return this.timeline;
    }

    /**
     * 將 WorkItem 陣列轉換為 Timeline 項目
     */
    convertWorkItemsToTimelineItems(workItems: WorkItem[]): TimelineItemDTO[] {
        return workItems.map(workItem => this.convertWorkItemToTimelineItem(workItem));
    }

    /**
     * 將單個 WorkItem 轉換為 Timeline 項目
     */
    convertWorkItemToTimelineItem(workItem: WorkItem): TimelineItemDTO {
        return {
            id: workItem.id,
            content: this.generateItemContent(workItem),
            start: workItem.startTime,
            end: workItem.endTime,
            group: workItem.assigneeId || 'unassigned',
            className: this.getItemClassName(workItem),
            style: this.getItemStyle(workItem),
            type: 'range',
            title: this.generateItemTooltip(workItem),
            editable: {
                add: false,
                updateTime: true,
                updateGroup: true,
                remove: true,
                overrideItems: false
            }
        };
    }

    /**
     * 載入工作項目到 Timeline
     */
    loadWorkItems(workItems: WorkItem[]): void {
        const timelineItems = this.convertWorkItemsToTimelineItems(workItems);
        this.itemsDataSet.clear();
        this.itemsDataSet.add(timelineItems);
    }

    /**
     * 更新單個工作項目
     */
    updateWorkItem(workItem: WorkItem): void {
        const timelineItem = this.convertWorkItemToTimelineItem(workItem);
        this.itemsDataSet.update(timelineItem);
    }

    /**
     * 新增工作項目
     */
    addWorkItem(workItem: WorkItem): void {
        const timelineItem = this.convertWorkItemToTimelineItem(workItem);
        this.itemsDataSet.add(timelineItem);
    }

    /**
     * 移除工作項目
     */
    removeWorkItem(workItemId: string): void {
        this.itemsDataSet.remove(workItemId);
    }

    /**
     * 設定群組資料
     */
    setGroups(groups: TimelineGroupDTO[]): void {
        this.groupsDataSet.clear();
        this.groupsDataSet.add(groups);
    }

    /**
     * 根據負責人建立群組
     */
    createGroupsFromWorkItems(workItems: WorkItem[]): TimelineGroupDTO[] {
        const assigneeMap = new Map<string, string>();

        workItems.forEach(item => {
            if (item.assigneeId && item.assigneeName && !assigneeMap.has(item.assigneeId)) {
                assigneeMap.set(item.assigneeId, item.assigneeName);
            }
        });

        const groups: TimelineGroupDTO[] = [];

        // 未分配群組
        groups.push({
            id: 'unassigned',
            content: '未分配',
            order: 0,
            className: 'group-unassigned'
        });

        // 負責人群組
        let order = 1;
        assigneeMap.forEach((name, id) => {
            groups.push({
                id: id,
                content: name,
                order: order++,
                className: 'group-assignee'
            });
        });

        return groups;
    }

    /**
     * 取得 Timeline 實例
     */
    getTimeline(): Timeline | null {
        return this.timeline;
    }

    /**
     * 取得項目資料集
     */
    getItemsDataSet(): DataSet<TimelineItemDTO> {
        return this.itemsDataSet;
    }

    /**
     * 取得群組資料集
     */
    getGroupsDataSet(): DataSet<TimelineGroupDTO> {
        return this.groupsDataSet;
    }

    /**
     * 設定 Timeline 可見範圍
     */
    setWindow(start: Date, end: Date): void {
        this.timeline?.setWindow(start, end);
    }

    /**
     * 聚焦到特定項目
     */
    focusOnItem(itemId: string): void {
        this.timeline?.focus(itemId);
    }

    /**
     * 銷毀 Timeline
     */
    destroy(): void {
        if (this.timeline) {
            this.timeline.destroy();
            this.timeline = null;
        }
    }

    /**
     * 將設定轉換為 vis-timeline 選項
     */
    private convertConfigToOptions(config: TimelineConfigDTO): TimelineOptions {
        return {
            orientation: config.orientation || 'top',
            stack: config.stack !== false,
            stackSubgroups: config.stackSubgroups !== false,
            showCurrentTime: config.showCurrentTime !== false,
            showMajorLabels: config.showMajorLabels !== false,
            showMinorLabels: config.showMinorLabels !== false,
            timeAxis: config.timeAxis,
            format: config.format,
            editable: config.editable !== false,
            selectable: config.selectable !== false,
            multiselect: config.multiselect === true,
            zoomable: config.zoomable !== false,
            moveable: config.moveable !== false,
            margin: {
                item: 10,
                axis: 20
            },
            template: (item: any) => {
                return item.content;
            }
        };
    }

    /**
     * 產生項目內容 HTML
     */
    private generateItemContent(workItem: WorkItem): string {
        const statusIcon = this.getStatusIcon(workItem.status);
        const typeIcon = this.getTypeIcon(workItem.type);

        return `
			<div class="timeline-item-content">
				<span class="timeline-item-icons">
					${statusIcon}
					${typeIcon}
				</span>
				<span class="timeline-item-title">${workItem.title}</span>
			</div>
		`;
    }

    /**
     * 產生項目提示訊息
     */
    private generateItemTooltip(workItem: WorkItem): string {
        const duration = Math.round((workItem.endTime.getTime() - workItem.startTime.getTime()) / (1000 * 60));
        return `
			<div>
				<strong>${workItem.title}</strong><br/>
				狀態: ${this.getStatusText(workItem.status)}<br/>
				類型: ${this.getTypeText(workItem.type)}<br/>
				持續時間: ${duration} 分鐘<br/>
				${workItem.description ? `描述: ${workItem.description}<br/>` : ''}
				${workItem.assigneeName ? `負責人: ${workItem.assigneeName}` : ''}
			</div>
		`;
    }

    /**
     * 取得項目 CSS 類別
     */
    private getItemClassName(workItem: WorkItem): string {
        const classes = ['timeline-item'];
        classes.push(`status-${workItem.status}`);
        classes.push(`type-${workItem.type}`);
        classes.push(`priority-${workItem.priority}`);
        return classes.join(' ');
    }

    /**
     * 取得項目樣式
     */
    private getItemStyle(workItem: WorkItem): string {
        const styles: string[] = [];

        // 根據狀態設定顏色
        switch (workItem.status) {
            case WorkItemStatus.PLANNED:
                styles.push('background-color: #e3f2fd; border-color: #2196f3');
                break;
            case WorkItemStatus.IN_PROGRESS:
                styles.push('background-color: #fff3e0; border-color: #ff9800');
                break;
            case WorkItemStatus.COMPLETED:
                styles.push('background-color: #e8f5e8; border-color: #4caf50');
                break;
            case WorkItemStatus.CANCELLED:
                styles.push('background-color: #fce4ec; border-color: #e91e63');
                break;
            case WorkItemStatus.OVERDUE:
                styles.push('background-color: #ffebee; border-color: #f44336');
                break;
        }

        return styles.join('; ');
    }

    /**
     * 取得狀態圖示
     */
    private getStatusIcon(status: WorkItemStatus): string {
        switch (status) {
            case WorkItemStatus.PLANNED:
                return '<i class="status-icon planned">📅</i>';
            case WorkItemStatus.IN_PROGRESS:
                return '<i class="status-icon in-progress">⚡</i>';
            case WorkItemStatus.COMPLETED:
                return '<i class="status-icon completed">✅</i>';
            case WorkItemStatus.CANCELLED:
                return '<i class="status-icon cancelled">❌</i>';
            case WorkItemStatus.OVERDUE:
                return '<i class="status-icon overdue">⚠️</i>';
            default:
                return '<i class="status-icon">❓</i>';
        }
    }

    /**
     * 取得類型圖示
     */
    private getTypeIcon(type: WorkItemType): string {
        switch (type) {
            case WorkItemType.TASK:
                return '<i class="type-icon task">📝</i>';
            case WorkItemType.MEETING:
                return '<i class="type-icon meeting">👥</i>';
            case WorkItemType.BREAK:
                return '<i class="type-icon break">☕</i>';
            case WorkItemType.PROJECT:
                return '<i class="type-icon project">📊</i>';
            case WorkItemType.MAINTENANCE:
                return '<i class="type-icon maintenance">🔧</i>';
            default:
                return '<i class="type-icon">📋</i>';
        }
    }

    /**
     * 取得狀態文字
     */
    private getStatusText(status: WorkItemStatus): string {
        switch (status) {
            case WorkItemStatus.PLANNED:
                return '已規劃';
            case WorkItemStatus.IN_PROGRESS:
                return '進行中';
            case WorkItemStatus.COMPLETED:
                return '已完成';
            case WorkItemStatus.CANCELLED:
                return '已取消';
            case WorkItemStatus.OVERDUE:
                return '逾期';
            default:
                return '未知';
        }
    }

    /**
     * 取得類型文字
     */
    private getTypeText(type: WorkItemType): string {
        switch (type) {
            case WorkItemType.TASK:
                return '任務';
            case WorkItemType.MEETING:
                return '會議';
            case WorkItemType.BREAK:
                return '休息';
            case WorkItemType.PROJECT:
                return '專案';
            case WorkItemType.MAINTENANCE:
                return '維護';
            default:
                return '未知';
        }
    }
}
