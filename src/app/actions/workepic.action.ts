"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkEpicTemplate {
    epicId: string; // 唯一識別碼
    title: string; // 標題
    startDate: string; // 預計開始時間
    endDate: string; // 預計結束時間
}

export interface WorkEpicEntity extends WorkEpicTemplate {
    insuranceStatus: "無" | "有"; // 保險狀態
    insuranceDate?: string; // 保險日期（僅當保險狀態為 "有" 時存在）
    owner: string; // 負責人
    status: "待開始" | "進行中" | "已完成" | "已取消"; // 狀態
    priority: number; // 優先級，數字愈低愈優先
    region: "北部" | "中部" | "南部" | "東部" | "離島"; // 區域
    address: string; // 詳細地址
    createdAt: string; // 建立時間
}

export async function getAllWorkEpics(isTemplate: boolean): Promise<WorkEpicTemplate[] | WorkEpicEntity[]> {
    const snapshot = await firestoreAdmin.collection("workEpic").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkEpicTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkEpicEntity);
    }
}

export async function addWorkEpic(epic: WorkEpicTemplate | WorkEpicEntity): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epic.epicId).set({
        ...epic,
        createdAt: "createdAt" in epic ? epic.createdAt : new Date().toISOString() // 自動設置建立時間
    });
}

export async function updateWorkEpic(epicId: string, updates: Partial<WorkEpicEntity>): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epicId).update(updates);
}

export async function deleteWorkEpic(epicId: string): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epicId).delete();
}
