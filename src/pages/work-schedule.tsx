import React from 'react';
import {
    Timeline,
    Toolbar,
    WorkItem,
    WorkItemPriority,
    WorkItemStatus,
    WorkItemType,
    createWorkScheduleModule
} from '../modules/workSchedule';

/**
 * 工作排程頁面 - 展示 vis-timeline 整合範例
 */
export default function WorkSchedulePage() {
    // 初始化工作排程模組
    const workScheduleModule = React.useMemo(() => createWorkScheduleModule(), []);

    // 範例工作項目資料
    const sampleWorkItems: WorkItem[] = [
        {
            id: '1',
            title: '專案會議',
            description: '討論 Q1 專案進度和里程碑',
            startTime: new Date('2024-01-15T09:00:00'),
            endTime: new Date('2024-01-15T10:30:00'),
            type: WorkItemType.MEETING,
            status: WorkItemStatus.PLANNED,
            assigneeId: 'user1',
            assigneeName: '張小明',
            priority: WorkItemPriority.HIGH,
            tags: ['專案', '會議'],
            createdAt: new Date('2024-01-10T08:00:00'),
            updatedAt: new Date('2024-01-10T08:00:00')
        },
        {
            id: '2',
            title: '程式碼開發',
            description: '實作使用者認證功能',
            startTime: new Date('2024-01-15T11:00:00'),
            endTime: new Date('2024-01-15T16:00:00'),
            type: WorkItemType.TASK,
            status: WorkItemStatus.IN_PROGRESS,
            assigneeId: 'user2',
            assigneeName: '李小華',
            priority: WorkItemPriority.MEDIUM,
            tags: ['開發', '認證'],
            createdAt: new Date('2024-01-10T08:00:00'),
            updatedAt: new Date('2024-01-14T10:00:00')
        },
        {
            id: '3',
            title: '午休時間',
            description: '休息時間',
            startTime: new Date('2024-01-15T12:00:00'),
            endTime: new Date('2024-01-15T13:00:00'),
            type: WorkItemType.BREAK,
            status: WorkItemStatus.PLANNED,
            priority: WorkItemPriority.LOW,
            createdAt: new Date('2024-01-10T08:00:00'),
            updatedAt: new Date('2024-01-10T08:00:00')
        },
        {
            id: '4',
            title: '系統維護',
            description: '資料庫效能最佳化',
            startTime: new Date('2024-01-15T17:00:00'),
            endTime: new Date('2024-01-15T19:00:00'),
            type: WorkItemType.MAINTENANCE,
            status: WorkItemStatus.COMPLETED,
            assigneeId: 'user3',
            assigneeName: '王小美',
            priority: WorkItemPriority.URGENT,
            tags: ['維護', '資料庫'],
            createdAt: new Date('2024-01-10T08:00:00'),
            updatedAt: new Date('2024-01-15T19:00:00')
        }
    ];

    const handleWorkItemUpdate = React.useCallback(async (workItem: WorkItem) => {
        try {
            // 使用 UpdateWorkTimeUseCase 來更新工作項目
            await workScheduleModule.updateWorkTimeUseCase.execute([{
                id: workItem.id,
                startTime: workItem.startTime,
                endTime: workItem.endTime
            }]);
            console.log('工作項目已更新:', workItem);
        } catch (error) {
            console.error('更新工作項目失敗:', error);
        }
    }, [workScheduleModule]);

    const handleWorkItemCreate = React.useCallback(async (workItem: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            // 這裡可以呼叫建立工作項目的服務
            console.log('建立新工作項目:', workItem);
        } catch (error) {
            console.error('建立工作項目失敗:', error);
        }
    }, []);

    const handleWorkItemDelete = React.useCallback(async (workItemId: string) => {
        try {
            await workScheduleModule.repository.delete(workItemId);
            console.log('工作項目已刪除:', workItemId);
        } catch (error) {
            console.error('刪除工作項目失敗:', error);
        }
    }, [workScheduleModule]);

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="mx-auto max-w-7xl">
                {/* 頁面標題 */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">工作排程管理</h1>
                    <p className="mt-2 text-gray-600">
                        使用 vis-timeline 進行工作時間的視覺化管理
                    </p>
                </div>

                {/* 統計資訊 */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-white p-4 shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
                                    📋
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">總工作項目</p>
                                <p className="text-lg font-semibold text-gray-900">{sampleWorkItems.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white">
                                    ✅
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">已完成</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {sampleWorkItems.filter(item => item.status === WorkItemStatus.COMPLETED).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-white">
                                    ⏳
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">進行中</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {sampleWorkItems.filter(item => item.status === WorkItemStatus.IN_PROGRESS).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white">
                                    🚨
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">高優先級</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {sampleWorkItems.filter(item => item.priority === WorkItemPriority.HIGH || item.priority === WorkItemPriority.URGENT).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 時間軸容器 */}
                <div className="rounded-lg bg-white shadow">
                    <div className="p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">工作時間軸</h2>

                        {/* 工具列 */}
                        <div className="mb-4">
                            <Toolbar
                                onViewModeChange={(mode) => console.log('視圖模式變更:', mode)}
                                onFilterChange={(filters) => console.log('篩選器變更:', filters)}
                                onDateRangeChange={(start, end) => console.log('日期範圍變更:', start, end)}
                                onRefresh={() => console.log('重新整理')}
                            />
                        </div>

                        {/* 時間軸元件 */}
                        <div className="h-96">
                            <Timeline
                                workItems={sampleWorkItems}
                                onItemUpdate={handleWorkItemUpdate}
                                onItemCreate={handleWorkItemCreate}
                                onItemDelete={handleWorkItemDelete}
                                onItemSelect={(item) => console.log('選擇工作項目:', item)}
                                className="h-full"
                            />
                        </div>
                    </div>
                </div>

                {/* 說明文件 */}
                <div className="mt-6 rounded-lg bg-white p-4 shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">使用說明</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">時間軸操作</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• 拖拽工作項目可調整時間</li>
                                <li>• 點擊工作項目查看詳細資訊</li>
                                <li>• 使用滑鼠滾輪縮放時間軸</li>
                                <li>• 雙擊空白區域建立新工作項目</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">工作項目類型</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• <span className="inline-block w-3 h-3 bg-blue-200 rounded mr-2"></span>任務 (Task)</li>
                                <li>• <span className="inline-block w-3 h-3 bg-green-200 rounded mr-2"></span>會議 (Meeting)</li>
                                <li>• <span className="inline-block w-3 h-3 bg-yellow-200 rounded mr-2"></span>休息 (Break)</li>
                                <li>• <span className="inline-block w-3 h-3 bg-red-200 rounded mr-2"></span>維護 (Maintenance)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
