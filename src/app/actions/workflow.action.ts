"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkFlow {
    flowId: string; // 唯一識別碼
    workTypeId: string; // 關聯的 WorkType
    steps: {
        stepName: string; // 步驟名稱
        order: number; // 步驟順序（從 1 開始）
        requiredSkills: string[]; // 所需技能
    }[];
}

export interface WorkFlowEntity extends WorkFlow {
    /**
     * 流程描述
     */
    description?: string;
    /**
     * 是否啟用
     */
    enabled?: boolean;
}

export async function getAllWorkFlows(isEntity: boolean = false): Promise<WorkFlow[] | WorkFlowEntity[]> {
    const snapshot = await firestoreAdmin.collection("workFlow").get();
    if (isEntity) {
        return snapshot.docs.map(doc => doc.data() as WorkFlowEntity);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkFlow);
    }
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
