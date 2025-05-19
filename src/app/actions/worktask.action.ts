"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkTaskTemplate {
    taskId: string; // 唯一識別碼
    itemId: string; // 關聯的 WorkItem
    targetQuantity: number; // 目標數量
    unit: string; // 單位
}

export interface WorkTaskEntity extends WorkTaskTemplate {
    completedQuantity: number; // 已完成數量
    status: "待分配" | "執行中" | "已完成"; // 狀態
}

export async function getAllWorkTasks(isTemplate: boolean): Promise<WorkTaskTemplate[] | WorkTaskEntity[]> {
    const snapshot = await firestoreAdmin.collection("workTask").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkTaskTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkTaskEntity);
    }
}

export async function addWorkTask(task: WorkTaskTemplate | WorkTaskEntity): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(task.taskId).set(task);
}

export async function updateWorkTask(taskId: string, updates: Partial<WorkTaskTemplate | WorkTaskEntity>): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(taskId).update(updates);
}

export async function deleteWorkTask(taskId: string): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(taskId).delete();
}

/**
 * 取得所有 workTask 的原始資料清單
 */
export async function listWorkTask(): Promise<any[]> {
    const snapshot = await firestoreAdmin.collection("workTask").get();
    return snapshot.docs.map(doc => doc.data());
}
