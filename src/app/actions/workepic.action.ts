"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkEpic {
    epicId: string;
    title: string;
    startDate: string;
    endDate: string;
    insuranceStatus: "無" | "有";
    insuranceDate?: string;
    owner: string;
    status: "待開始" | "進行中" | "已完成" | "已取消";
    priority: number;
    location: string;
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
