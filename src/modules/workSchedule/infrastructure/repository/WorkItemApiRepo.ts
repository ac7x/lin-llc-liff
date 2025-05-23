import { CreateWorkItemDTO, UpdateWorkItemDTO, WorkItemDTO } from '../../application/dto/WorkItemDTO';
import { WorkItem, WorkItemVO } from '../../domain/model/WorkItem';
import { WorkItemRepository } from '../../domain/repository/WorkItemRepo';

/**
 * 工作項目 API 儲存庫實作
 * 負責與後端 API 進行資料交換
 */
export class WorkItemApiRepository implements WorkItemRepository {
    private baseUrl: string;

    constructor(baseUrl: string = '/api/work-items') {
        this.baseUrl = baseUrl;
    }

    async findById(id: string): Promise<WorkItem | null> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`);
            if (response.status === 404) {
                return null;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const dto: WorkItemDTO = await response.json();
            return this.dtoToWorkItem(dto);
        } catch (error) {
            console.error('Error fetching work item by id:', error);
            throw error;
        }
    }

    async findByTimeRange(startTime: Date, endTime: Date): Promise<WorkItem[]> {
        try {
            const params = new URLSearchParams({
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

            const response = await fetch(`${this.baseUrl}?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dtos: WorkItemDTO[] = await response.json();
            return dtos.map(dto => this.dtoToWorkItem(dto));
        } catch (error) {
            console.error('Error fetching work items by time range:', error);
            throw error;
        }
    }

    async findByAssignee(assigneeId: string): Promise<WorkItem[]> {
        try {
            const params = new URLSearchParams({ assigneeId });
            const response = await fetch(`${this.baseUrl}?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dtos: WorkItemDTO[] = await response.json();
            return dtos.map(dto => this.dtoToWorkItem(dto));
        } catch (error) {
            console.error('Error fetching work items by assignee:', error);
            throw error;
        }
    }

    async findByStatus(status: string): Promise<WorkItem[]> {
        try {
            const params = new URLSearchParams({ status });
            const response = await fetch(`${this.baseUrl}?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dtos: WorkItemDTO[] = await response.json();
            return dtos.map(dto => this.dtoToWorkItem(dto));
        } catch (error) {
            console.error('Error fetching work items by status:', error);
            throw error;
        }
    }

    async findAll(): Promise<WorkItem[]> {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dtos: WorkItemDTO[] = await response.json();
            return dtos.map(dto => this.dtoToWorkItem(dto));
        } catch (error) {
            console.error('Error fetching all work items:', error);
            throw error;
        }
    }

    async save(workItem: WorkItemVO): Promise<WorkItem> {
        try {
            const createDto: CreateWorkItemDTO = {
                title: workItem.title,
                description: workItem.description,
                startTime: workItem.startTime.toISOString(),
                endTime: workItem.endTime.toISOString(),
                type: workItem.type,
                assigneeId: workItem.assigneeId,
                priority: workItem.priority,
                tags: workItem.tags,
                metadata: workItem.metadata
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createDto)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dto: WorkItemDTO = await response.json();
            return this.dtoToWorkItem(dto);
        } catch (error) {
            console.error('Error saving work item:', error);
            throw error;
        }
    }

    async update(id: string, workItem: Partial<WorkItemVO>): Promise<WorkItem> {
        try {
            const updateDto: UpdateWorkItemDTO = {
                title: workItem.title,
                description: workItem.description,
                startTime: workItem.startTime?.toISOString(),
                endTime: workItem.endTime?.toISOString(),
                type: workItem.type,
                status: workItem.status,
                assigneeId: workItem.assigneeId,
                priority: workItem.priority,
                tags: workItem.tags,
                metadata: workItem.metadata
            };

            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateDto)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dto: WorkItemDTO = await response.json();
            return this.dtoToWorkItem(dto);
        } catch (error) {
            console.error('Error updating work item:', error);
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error deleting work item:', error);
            return false;
        }
    }

    async saveBatch(workItems: WorkItemVO[]): Promise<WorkItem[]> {
        try {
            const createDtos: CreateWorkItemDTO[] = workItems.map(workItem => ({
                title: workItem.title,
                description: workItem.description,
                startTime: workItem.startTime.toISOString(),
                endTime: workItem.endTime.toISOString(),
                type: workItem.type,
                assigneeId: workItem.assigneeId,
                priority: workItem.priority,
                tags: workItem.tags,
                metadata: workItem.metadata
            }));

            const response = await fetch(`${this.baseUrl}/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createDtos)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dtos: WorkItemDTO[] = await response.json();
            return dtos.map(dto => this.dtoToWorkItem(dto));
        } catch (error) {
            console.error('Error saving work items batch:', error);
            throw error;
        }
    }

    /**
     * 檢查工作項目時間衝突
     */
    async checkTimeConflicts(workItem: WorkItemVO, excludeId?: string): Promise<WorkItem[]> {
        try {
            const params = new URLSearchParams({
                startTime: workItem.startTime.toISOString(),
                endTime: workItem.endTime.toISOString(),
                checkConflicts: 'true'
            });

            if (excludeId) {
                params.append('excludeId', excludeId);
            }

            const response = await fetch(`${this.baseUrl}/conflicts?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dtos: WorkItemDTO[] = await response.json();
            return dtos.map(dto => this.dtoToWorkItem(dto));
        } catch (error) {
            console.error('Error checking time conflicts:', error);
            throw error;
        }
    }

    /**
     * 將 DTO 轉換為 WorkItem
     */
    private dtoToWorkItem(dto: WorkItemDTO): WorkItem {
        return {
            id: dto.id,
            title: dto.title,
            description: dto.description,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            type: dto.type,
            status: dto.status,
            assigneeId: dto.assigneeId,
            assigneeName: dto.assigneeName,
            priority: dto.priority,
            tags: dto.tags,
            metadata: dto.metadata,
            createdAt: new Date(dto.createdAt),
            updatedAt: new Date(dto.updatedAt)
        };
    }
}
