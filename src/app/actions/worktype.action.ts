"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkTypeTemplate {
    typeId: string; // 唯一識別碼
    title: string; // 標題
    requiredSkills: string[]; // 所需技能
}

export interface WorkTypeEntity extends WorkTypeTemplate {
    defaultWorkflow?: string; // 預設關聯的 WorkFlow
}

export type WorkType = WorkTypeTemplate | WorkTypeEntity;

export async function getAllWorkTypes(isEntity: boolean = false): Promise<WorkTypeTemplate[] | WorkTypeEntity[]> {
    const snapshot = await firestoreAdmin.collection("workType").get();
    if (isEntity) {
        return snapshot.docs.map(doc => doc.data() as WorkTypeEntity);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkTypeTemplate);
    }
}

export async function addWorkType(type: WorkTypeTemplate | WorkTypeEntity): Promise<void> {
    await firestoreAdmin.collection("workType").doc(type.typeId).set(type);
}

export async function updateWorkType(typeId: string, updates: Partial<WorkTypeEntity>): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).update(updates);
}

export async function deleteWorkType(typeId: string): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).delete();
}
