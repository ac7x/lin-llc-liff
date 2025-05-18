"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkType {
    typeId: string;
    title: string;
    defaultWorkflow: string;
    requiredSkills: string[];
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
