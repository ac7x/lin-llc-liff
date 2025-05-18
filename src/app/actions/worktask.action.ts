"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkTask {
    taskId: string;
    itemId: string;
    targetQuantity: number;
    completedQuantity: number;
    unit: string;
    status: "待分配" | "執行中" | "已完成";
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
