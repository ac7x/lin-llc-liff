"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkTypeTemplate {
    typeId: string; // 唯一識別碼
    title: string; // 標題
    requiredSkills: string[]; // 所需技能
}

export interface WorkTypeEntity extends WorkTypeTemplate {
    defaultWorkflow?: string; // 預設關聯的 WorkFlow
}

export type WorkType = WorkTypeTemplate | WorkTypeEntity;

/**
 * 取得所有 WorkType
 * @param isEntity 是否回傳 WorkTypeEntity 型態
 * @returns WorkTypeTemplate 或 WorkTypeEntity 陣列
 */
export async function getAllWorkTypes(isEntity: boolean = false): Promise<WorkTypeTemplate[] | WorkTypeEntity[]> {
    const snapshot = await firestoreAdmin.collection("workType").get();
    if (isEntity) {
        return snapshot.docs.map(doc => doc.data() as WorkTypeEntity);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkTypeTemplate);
    }
}

/**
 * 新增 WorkType 至 Firestore 資料庫
 * @param type WorkTypeTemplate 或 WorkTypeEntity 物件，包含類型資訊
 * @returns 無回傳值，僅執行新增動作
 */
export async function addWorkType(type: WorkTypeTemplate | WorkTypeEntity): Promise<void> {
    await firestoreAdmin.collection("workType").doc(type.typeId).set(type);
}

/**
 * 更新指定 WorkType 至 Firestore 資料庫
 * @param typeId WorkType 的唯一識別碼
 * @param updates 欲更新的 WorkTypeEntity 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkType(typeId: string, updates: Partial<WorkTypeEntity>): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).update(updates);
}

/**
 * 從 Firestore 資料庫刪除指定 WorkType
 * @param typeId WorkType 的唯一識別碼
 * @returns 無回傳值，僅執行刪除動作
 */
export async function deleteWorkType(typeId: string): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).delete();
}

/**
 * 取得所有 WorkType 的原始資料清單
 * @returns WorkTypeEntity 陣列
 */
export async function listWorkType(): Promise<WorkTypeEntity[]> {
    const snapshot = await firestoreAdmin.collection("workType").get();
    return snapshot.docs.map(doc => doc.data() as WorkTypeEntity);
}
