"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkTask {
    taskId: string; // 唯一識別碼
    itemId: string; // 關聯的 WorkItem
    targetQuantity: number; // 目標數量
    completedQuantity: number; // 已完成數量
    unit: string; // 單位
    status: "待分配" | "執行中" | "已完成"; // 狀態
}

export async function getAllWorkTasks(): Promise<WorkTask[]> {
    const snapshot = await firestoreAdmin.collection("workTask").get();
    return snapshot.docs.map(doc => doc.data() as WorkTask);
}

export async function addWorkTask(task: WorkTask): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(task.taskId).set(task);
}

export async function updateWorkTask(taskId: string, updates: Partial<WorkTask>): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(taskId).update(updates);
}

export async function deleteWorkTask(taskId: string): Promise<void> {
    await firestoreAdmin.collection("workTask").doc(taskId).delete();
}
