"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkItem {
    itemId: string; // 唯一識別碼
    epicId: string; // 關聯的 WorkEpic
    flowId: string; // 關聯的 WorkFlow
    currentStep: string; // 當前步驟，引用 WorkFlow.Steps
    assignedTo: string; // 指派對象
    status: "未開始" | "進行中" | "已完成" | "阻塞中"; // 狀態
}

export async function getAllWorkItems(): Promise<WorkItem[]> {
    const snapshot = await firestoreAdmin.collection("workItem").get();
    return snapshot.docs.map(doc => doc.data() as WorkItem);
}

export async function addWorkItem(item: WorkItem): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(item.itemId).set(item);
}

export async function updateWorkItem(itemId: string, updates: Partial<WorkItem>): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(itemId).update(updates);
}

export async function deleteWorkItem(itemId: string): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(itemId).delete();
}
