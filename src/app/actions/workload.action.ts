"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkLoad {
    loadId: string; // 唯一識別碼
    taskId: string; // 關聯的 WorkTask
    executor: string; // 執行者
    plannedQuantity: number; // 計劃數量
    actualQuantity: number; // 實際完成數量
    unit: string; // 單位
    notes?: string; // 備註
    plannedStartTime: string; // 計劃開始時間
    plannedEndTime: string; // 計劃結束時間
}

export async function getAllWorkLoads(): Promise<WorkLoad[]> {
    const snapshot = await firestoreAdmin.collection("workLoad").get();
    return snapshot.docs.map(doc => doc.data() as WorkLoad);
}

export async function addWorkLoad(load: WorkLoad): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(load.loadId).set(load);
}

export async function updateWorkLoad(loadId: string, updates: Partial<WorkLoad>): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(loadId).update(updates);
}

export async function deleteWorkLoad(loadId: string): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(loadId).delete();
}
