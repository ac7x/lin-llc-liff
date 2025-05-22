// 此檔案已棄用，請改用 workTypeEntity.flows 作為流程模板來源。
// Deprecated: 請勿再直接操作 workFlow 集合，請將流程寫入 workType.flows 陣列。

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

/**
 * 取得所有 WorkFlow
 * @param isEntity 是否回傳 WorkFlowEntity 型態
 * @returns WorkFlow 或 WorkFlowEntity 陣列
 */
export async function getAllWorkFlows(isEntity: boolean = false): Promise<WorkFlow[] | WorkFlowEntity[]> {
    const snapshot = await firestoreAdmin.collection("workFlow").get();
    if (isEntity) {
        return snapshot.docs.map(doc => doc.data() as WorkFlowEntity);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkFlow);
    }
}

/**
 * 新增 WorkFlow 至 Firestore 資料庫
 * @param flow WorkFlow 物件，包含流程資訊
 * @returns 無回傳值，僅執行新增動作
 */
export async function addWorkFlow(flow: WorkFlow): Promise<void> {
    await firestoreAdmin.collection("workFlow").doc(flow.flowId).set(flow);
}

/**
 * 更新指定 WorkFlow 至 Firestore 資料庫
 * @param flowId WorkFlow 的唯一識別碼
 * @param updates 欲更新的 WorkFlow 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkFlow(flowId: string, updates: Partial<WorkFlow>): Promise<void> {
    await firestoreAdmin.collection("workFlow").doc(flowId).update(updates);
}

/**
 * 從 Firestore 資料庫刪除指定 WorkFlow
 * @param flowId WorkFlow 的唯一識別碼
 * @returns 無回傳值，僅執行刪除動作
 */
export async function deleteWorkFlow(flowId: string): Promise<void> {
    await firestoreAdmin.collection("workFlow").doc(flowId).delete();
}
