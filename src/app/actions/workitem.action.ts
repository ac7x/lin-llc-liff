"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkItem {
    itemId: string;
    epicId: string;
    flowId: string;
    currentStep: string;
    assignedTo: string;
    status: "未開始" | "進行中" | "已完成" | "阻塞中";
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
