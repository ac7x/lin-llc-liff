import { WorkItem } from '../../domain/model/WorkItem';
import { WorkItemRepository } from '../../domain/repository/WorkItemRepo';
import { ScheduleService } from '../../domain/service/ScheduleService';

/**
 * 更新工作時間用例
 * 處理拖曳更新時間的應用邏輯
 */
export class UpdateWorkTimeUseCase {
    constructor(
        private readonly workItemRepository: WorkItemRepository,
        private readonly scheduleService: ScheduleService
    ) { }

    /**
     * 執行工作項目時間更新
     */
    async execute(request: UpdateWorkTimeRequest): Promise<UpdateWorkTimeResponse> {
        try {
            // 驗證輸入
            this.validateRequest(request);

            // 更新工作項目時間
            const updatedWorkItem = await this.scheduleService.updateWorkItemTime(
                request.workItemId,
                request.newStartTime,
                request.newEndTime
            );

            return {
                success: true,
                workItem: updatedWorkItem,
                message: '工作時間更新成功'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '未知錯誤',
                message: '工作時間更新失敗'
            };
        }
    }

    /**
     * 批次更新多個工作項目時間
     */
    async executeBatch(requests: UpdateWorkTimeRequest[]): Promise<BatchUpdateWorkTimeResponse> {
        const results: UpdateWorkTimeResponse[] = [];
        const errors: string[] = [];

        for (const request of requests) {
            try {
                const result = await this.execute(request);
                results.push(result);

                if (!result.success) {
                    errors.push(`${request.workItemId}: ${result.error}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '未知錯誤';
                errors.push(`${request.workItemId}: ${errorMessage}`);
            }
        }

        return {
            success: errors.length === 0,
            results,
            errors: errors.length > 0 ? errors : undefined,
            totalCount: requests.length,
            successCount: results.filter(r => r.success).length,
            failureCount: errors.length
        };
    }

    private validateRequest(request: UpdateWorkTimeRequest): void {
        if (!request.workItemId || request.workItemId.trim() === '') {
            throw new Error('工作項目 ID 不能為空');
        }

        if (!(request.newStartTime instanceof Date)) {
            throw new Error('新開始時間必須是有效的日期');
        }

        if (!(request.newEndTime instanceof Date)) {
            throw new Error('新結束時間必須是有效的日期');
        }

        if (request.newStartTime >= request.newEndTime) {
            throw new Error('開始時間必須早於結束時間');
        }
    }
}

/**
 * 更新工作時間請求
 */
export interface UpdateWorkTimeRequest {
    workItemId: string;
    newStartTime: Date;
    newEndTime: Date;
    reason?: string;
}

/**
 * 更新工作時間回應
 */
export interface UpdateWorkTimeResponse {
    success: boolean;
    workItem?: WorkItem;
    error?: string;
    message: string;
}

/**
 * 批次更新工作時間回應
 */
export interface BatchUpdateWorkTimeResponse {
    success: boolean;
    results: UpdateWorkTimeResponse[];
    errors?: string[];
    totalCount: number;
    successCount: number;
    failureCount: number;
}
