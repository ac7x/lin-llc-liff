"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

/**
 * WorkItemTemplate 代表一個工作項目的基本資料結構
 * @property itemId 唯一識別碼
 * @property workTypeId 關聯的 WorkType
 * @property order 順序（從 1 開始）
 * @property title 標題
 * @property requiredSkills 所需技能
 */
export interface WorkItemTemplate {
    itemId: string; // 唯一識別碼
    workTypeId: string; // 關聯的 WorkType
    order: number; // 順序
    title: string; // 標題
    requiredSkills: string[]; // 所需技能
}

/**
 * WorkItemEntity 擴充自 WorkItemTemplate，可加入更多屬性
 * @property description 項目描述
 * @property enabled 是否啟用
 */
export interface WorkItemEntity extends WorkItemTemplate {
    description?: string;
    enabled?: boolean;
}

/**
 * 取得所有 WorkItem
 * @param isEntity 是否回傳 WorkItemEntity 型態
 * @returns WorkItemTemplate 或 WorkItemEntity 陣列
 */
export async function getAllWorkItems(isEntity: boolean = false): Promise<WorkItemTemplate[] | WorkItemEntity[]> {
    const snapshot = await firestoreAdmin.collection("workItem").get();
    if (isEntity) {
        return snapshot.docs.map(doc => doc.data() as WorkItemEntity);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkItemTemplate);
    }
}

/**
 * 新增 WorkItem 至 Firestore 資料庫
 * @param item WorkItemTemplate 或 WorkItemEntity 物件
 */
export async function addWorkItem(item: WorkItemTemplate | WorkItemEntity): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(item.itemId).set(item);
}

/**
 * 更新指定 WorkItem 至 Firestore 資料庫
 * @param itemId WorkItem 的唯一識別碼
 * @param updates 欲更新的欄位內容
 */
export async function updateWorkItem(itemId: string, updates: Partial<WorkItemEntity>): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(itemId).update(updates);
}

/**
 * 刪除指定 WorkItem
 * @param itemId WorkItem 的唯一識別碼
 */
export async function deleteWorkItem(itemId: string): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(itemId).delete();
}
