"use server";

/**
 * WorkTaskEntity 代表一個工作任務的資料結構，包含任務執行狀態
 * @property taskId 唯一識別碼
 * @property flowId 關聯的 WorkFlow
 * @property targetQuantity 目標數量
 * @property unit 單位
 * @property completedQuantity 已完成數量
 * @property title 標題，格式：epicTitle-workTypeTitle-workFlowStepName
 * @property status 任務狀態（待分配、執行中、已完成）
 */
export interface WorkTaskEntity {
    taskId: string; // 唯一識別碼
    flowId: string; // 關聯的 WorkFlow
    targetQuantity: number; // 目標數量
    unit: string; // 單位
    completedQuantity: number; // 已完成數量
    title: string; // 標題，格式：epicTitle-workTypeTitle-workFlowStepName
    status: "待分配" | "執行中" | "已完成"; // 狀態
}

/**
 * 取得所有 WorkTask
 * @returns WorkTaskEntity 陣列
 */
export async function getAllWorkTasks(): Promise<WorkTaskEntity[]> {
    // 取得所有 Epic，彙整所有 workTasks
    const { firestoreAdmin } = await import('@/modules/shared/infrastructure/persistence/firebase-admin/adminApp');
    const snapshot = await firestoreAdmin.collection('workEpic').get();
    const allTasks: WorkTaskEntity[] = [];
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.workTasks)) {
            (data.workTasks as WorkTaskEntity[]).forEach((task) => {
                allTasks.push(task);
            });
        }
    });
    return allTasks;
}
