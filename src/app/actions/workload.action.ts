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

export async function getAllWorkLoads(isTemplate: boolean): Promise<WorkLoadTemplate[] | WorkLoadEntity[]> {
    const snapshot = await firestoreAdmin.collection("workLoad").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkLoadTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkLoadEntity);
    }
}

export async function addWorkLoad(load: WorkLoadTemplate | WorkLoadEntity): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(load.loadId).set(load);
}

export async function updateWorkLoad(loadId: string, updates: Partial<WorkLoadEntity>): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(loadId).update(updates);
}

export async function deleteWorkLoad(loadId: string): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(loadId).delete();
}
