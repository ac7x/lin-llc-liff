"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkEpic {
    epicId: string; // 唯一識別碼
    title: string; // 標題
    startDate: string; // 預計開始時間
    endDate: string; // 預計結束時間
    insuranceStatus: "無" | "有"; // 保險狀態
    insuranceDate?: string; // 保險日期（僅當保險狀態為 "有" 時存在）
    owner: string; // 負責人
    status: "待開始" | "進行中" | "已完成" | "已取消"; // 狀態
    priority: number; // 優先級，數字愈低愈優先
    location: string; // 地點
}

export async function getAllWorkEpics(): Promise<WorkEpic[]> {
    const snapshot = await firestoreAdmin.collection("workEpic").get();
    return snapshot.docs.map(doc => doc.data() as WorkEpic);
}

export async function addWorkEpic(epic: WorkEpic): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epic.epicId).set(epic);
}

export async function updateWorkEpic(epicId: string, updates: Partial<WorkEpic>): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epicId).update(updates);
}

export async function deleteWorkEpic(epicId: string): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epicId).delete();
}
