"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase/firebase-admin-client";

export interface WorkFlow {
    flowId: string;
    workTypeId: string;
    steps: {
        stepName: string;
        order: number;
        requiredSkills: string[];
    }[];
}
export interface WorkFlowEntity extends WorkFlow {
    description?: string;
    enabled?: boolean;
}

export async function getAllWorkFlows(isEntity: boolean = false): Promise<WorkFlow[] | WorkFlowEntity[]> {
    const snapshot = await firestoreAdmin.collection("workFlow").get();
    return isEntity
        ? snapshot.docs.map(doc => doc.data() as WorkFlowEntity)
        : snapshot.docs.map(doc => doc.data() as WorkFlow);
}

export async function addWorkFlow(flow: WorkFlow): Promise<void> {
    await firestoreAdmin.collection("workFlow").doc(flow.flowId).set(flow);
}

export async function updateWorkFlow(flowId: string, updates: Partial<WorkFlow>): Promise<void> {
    await firestoreAdmin.collection("workFlow").doc(flowId).update(updates);
}

export async function deleteWorkFlow(flowId: string): Promise<void> {
    await firestoreAdmin.collection("workFlow").doc(flowId).delete();
}