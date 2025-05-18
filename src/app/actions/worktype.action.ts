"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkType {
    typeId: string; // 唯一識別碼
    title: string; // 標題
    defaultWorkflow?: string; // 預設關聯的 WorkFlow
    requiredSkills: string[]; // 所需技能
}

export async function getAllWorkTypes(): Promise<WorkType[]> {
    const snapshot = await firestoreAdmin.collection("workType").get();
    return snapshot.docs.map(doc => doc.data() as WorkType);
}

export async function addWorkType(type: WorkType): Promise<void> {
    await firestoreAdmin.collection("workType").doc(type.typeId).set(type);
}

export async function updateWorkType(typeId: string, updates: Partial<WorkType>): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).update(updates);
}

export async function deleteWorkType(typeId: string): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).delete();
}
