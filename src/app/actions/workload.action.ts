"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkLoadTemplate {
    loadId: string; // 唯一識別碼
    taskId: string; // 關聯的 WorkTask
    plannedQuantity: number; // 計劃數量
    unit: string; // 單位
    plannedStartTime: string; // 計劃開始時間
    plannedEndTime: string; // 計劃結束時間
}

export interface WorkLoadEntity extends WorkLoadTemplate {
    actualQuantity: number; // 實際完成數量
    executor: string; // 執行者
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
    await firestoreAdmin.collection("workLoad").doc(load.loadId).set(load);
}

/**
 * 更新指定 WorkLoad 至 Firestore 資料庫
 * @param loadId WorkLoad 的唯一識別碼
 * @param updates 欲更新的 WorkLoadEntity 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkLoad(loadId: string, updates: Partial<WorkLoadEntity>): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(loadId).update(updates);
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
