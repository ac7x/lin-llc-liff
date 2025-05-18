"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkLoad {
    loadId: string;
    taskId: string;
    executor: string;
    plannedQuantity: number;
    actualQuantity: number;
    unit: string;
    notes?: string;
    plannedStartTime: string;
    plannedEndTime: string;
}

export async function getAllWorkLoads(): Promise<WorkLoad[]> {
    const snapshot = await firestoreAdmin.collection("workLoad").get();
    return snapshot.docs.map(doc => doc.data() as WorkLoad);
}

export async function addWorkLoad(load: WorkLoad): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(load.loadId).set(load);
}

export async function updateWorkLoad(loadId: string, updates: Partial<WorkLoad>): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(loadId).update(updates);
}

export async function deleteWorkLoad(loadId: string): Promise<void> {
    await firestoreAdmin.collection("workLoad").doc(loadId).delete();
}
