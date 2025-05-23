/**
 * 工作排程資料存取介面
 * 定義 DDD repository contract
 */
import { VisTimelineGroup, VisTimelineItem } from '../model/valueObject/visTimelineValueObject'

export interface WorkScheduleRepository {
    getTimelineItems(epicIds?: string[]): Promise<VisTimelineItem[]>
    getTimelineGroups(): Promise<VisTimelineGroup[]>
    setTimelineItem(item: VisTimelineItem): Promise<void>
    removeTimelineItem(itemId: string): Promise<void>
}
