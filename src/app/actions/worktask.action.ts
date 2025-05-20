"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

/**
 * WorkTaskTemplate 代表一個工作任務的基本資料結構
 * @property taskId 唯一識別碼
 * @property flowId 關聯的 WorkFlow
 * @property targetQuantity 目標數量
 * @property unit 單位
 */
export interface WorkTaskTemplate {
    taskId: string; // 唯一識別碼
    flowId: string; // 關聯的 WorkFlow
    targetQuantity: number; // 目標數量
    unit: string; // 單位
}

/**
 * WorkTaskEntity 擴充自 WorkTaskTemplate，包含任務執行狀態
 * @property completedQuantity 已完成數量
 * @property title 標題，格式：epicTitle-workTypeTitle-workFlowStepName
 * @property status 任務狀態（待分配、執行中、已完成）
 */
export interface WorkTaskEntity extends WorkTaskTemplate {
    completedQuantity: number; // 已完成數量
    title: string; // 標題，格式：epicTitle-workTypeTitle-workFlowStepName
    status: "待分配" | "執行中" | "已完成"; // 狀態
}

/**
 * 取得所有 WorkTask
 * @param isTemplate 是否回傳 WorkTaskTemplate 型態
 * @returns WorkTaskTemplate 或 WorkTaskEntity 陣列
 */
export async function getAllWorkTasks(isTemplate: boolean): Promise<WorkTaskTemplate[] | WorkTaskEntity[]> {
    const snapshot = await firestoreAdmin.collection("workTask").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkTaskTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkTaskEntity);
    }
}

/**
 * 新增 WorkTask 至 Firestore 資料庫
 * @param task WorkTaskTemplate 或 WorkTaskEntity 物件，包含任務資訊
 * @returns 無回傳值，僅執行新增動作
 */
export async function addWorkTask(task: WorkTaskTemplate | WorkTaskEntity): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(task.taskId).set(task);
}

/**
 * 更新指定 WorkTask 至 Firestore 資料庫
 * @param taskId WorkTask 的唯一識別碼
 * @param updates 欲更新的 WorkTaskTemplate 或 WorkTaskEntity 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkTask(taskId: string, updates: Partial<WorkTaskTemplate | WorkTaskEntity>): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(taskId).update(updates);
}

/**
 * 從 Firestore 資料庫刪除指定 WorkTask
 * @param taskId WorkTask 的唯一識別碼
 * @returns 無回傳值，僅執行刪除動作
 */
export async function deleteWorkTask(taskId: string): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(taskId).delete();
}

/**
 * 取得所有 WorkTask 的原始資料清單
 * @returns WorkTaskEntity 陣列
 */
export async function listWorkTask(): Promise<WorkTaskEntity[]> {
    const snapshot = await firestoreAdmin.collection("workTask").get();
    return snapshot.docs.map(doc => doc.data() as WorkTaskEntity);
}
