"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkLoadTemplate {
    loadId: string; // 唯一識別碼
    taskId: string; // 關聯的 WorkTask
    plannedQuantity: number; // 計劃數量
    unit: string; // 單位
    plannedStartTime: string; // 計劃開始時間
    plannedEndTime: string; // 計劃結束時間
    executor?: string | string[]; // 允許模板也有 executor 欄位，兼容單人/多人
}

export interface WorkLoadEntity extends WorkLoadTemplate {
    actualQuantity: number; // 實際完成數量
    executor: string[]; // 執行者（多位）
    title: string; // 標題，格式：epicTitle-workTaskTitle
    notes?: string; // 備註
}

/**
 * 取得所有 WorkLoad
 * @param isTemplate 是否回傳 WorkLoadTemplate 型態
 * @returns WorkLoadTemplate 或 WorkLoadEntity 陣列
 */
export async function getAllWorkLoads(isTemplate: boolean): Promise<WorkLoadTemplate[] | WorkLoadEntity[]> {
    const snapshot = await firestoreAdmin.collection("workLoad").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkLoadTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkLoadEntity);
    }
}

/**
 * 新增 WorkLoad 至 Firestore 資料庫
 * @param load WorkLoadTemplate 或 WorkLoadEntity 物件，包含工作量資訊
 * @returns 無回傳值，僅執行新增動作
 */
export async function addWorkLoad(load: WorkLoadTemplate | WorkLoadEntity): Promise<void> {
    // 兼容單一 string 或 string[]
    const data = {
        ...load,
        executor: Array.isArray(load.executor) ? load.executor : load.executor ? [load.executor] : []
    };
    await firestoreAdmin.collection("workLoad").doc(load.loadId).set(data);
}

/**
 * 更新指定 WorkLoad 至 Firestore 資料庫
 * @param loadId WorkLoad 的唯一識別碼
 * @param updates 欲更新的 WorkLoadEntity 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkLoad(loadId: string, updates: Partial<WorkLoadEntity>): Promise<void> {
    // 兼容單一 string 或 string[]
    const patch = updates.executor !== undefined ? {
        ...updates,
        executor: Array.isArray(updates.executor) ? updates.executor : updates.executor ? [updates.executor] : []
    } : updates;
    await firestoreAdmin.collection("workLoad").doc(loadId).update(patch);
}

/**
 * 從 Firestore 資料庫刪除指定 WorkLoad
 * @param loadId WorkLoad 的唯一識別碼
 * @returns 無回傳值，僅執行刪除動作
 */
export async function deleteWorkLoad(loadId: string): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(loadId).delete();
}

/**
 * 取得所有 WorkLoad 的原始資料清單
 * @returns WorkLoadEntity 陣列
 */
export async function listWorkLoad(): Promise<WorkLoadEntity[]> {
    const snapshot = await firestoreAdmin.collection("workLoad").get();
    return snapshot.docs.map(doc => doc.data() as WorkLoadEntity);
}
