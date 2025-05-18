"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkItemBase {
    itemId: string; // 唯一識別碼
    epicId: string; // 關聯的 WorkEpic
    flowId: string; // 關聯的 WorkFlow
    currentStep: string; // 當前步驟，引用 WorkFlow.Steps
}

export interface WorkItemTemplate extends WorkItemBase {
    // 模板階段不需要指派對象和狀態
    templateSpecificField?: string; // 示例字段，避免空介面
}

export interface WorkItemEntity extends WorkItemBase {
    assignedTo: string; // 指派對象
    status: "未開始" | "進行中" | "已完成" | "阻塞中"; // 狀態
}

// 修改函式以分開處理模板和實體階段
export async function getAllWorkItems(isTemplate: boolean): Promise<WorkItemTemplate[] | WorkItemEntity[]> {
    const snapshot = await firestoreAdmin.collection("workItem").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkItemTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkItemEntity);
    }
}

export async function addWorkItem(item: WorkItemTemplate | WorkItemEntity): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(item.itemId).set(item);
}

export async function updateWorkItem(itemId: string, updates: Partial<WorkItemTemplate | WorkItemEntity>): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(itemId).update(updates);
}

export async function deleteWorkItem(itemId: string): Promise<void> {
    await firestoreAdmin.collection("workItem").doc(itemId).delete();
}
