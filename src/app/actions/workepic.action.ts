"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";
import { WorkFlowEntity } from "./workflow.action";
import { WorkLoadEntity } from "./workload.action";
import { WorkTaskEntity } from "./worktask.action";
import { WorkTypeEntity } from "./worktype.action";

export interface WorkEpicTemplate {
    epicId: string; // 唯一識別碼
    title: string; // 標題
    startDate: string; // 預計開始時間
    endDate: string; // 預計結束時間
}

export interface WorkEpicEntity extends WorkEpicTemplate {
    insuranceStatus?: "無" | "有"; // 修改為可選屬性
    insuranceDate?: string; // 保險日期（僅當保險狀態為 "有" 時存在）
    owner: { memberId: string; name: string }; // 負責人
    siteSupervisors?: { memberId: string; name: string }[]; // 監工
    safetyOfficers?: { memberId: string; name: string }[]; // 安全衛生人員（公安）
    status: "待開始" | "進行中" | "已完成" | "已取消"; // 狀態
    priority: number; // 優先級，數字愈低愈優先
    region: "北部" | "中部" | "南部" | "東部" | "離島"; // 區域
    address: string; // 詳細地址
    createdAt: string; // 建立時間
    workTypes?: WorkTypeEntity[]; // 新增屬性
    workFlows?: WorkFlowEntity[]; // 新增屬性
    workTasks?: WorkTaskEntity[]; // 新增屬性
    workLoads?: WorkLoadEntity[]; // 新增屬性
}

/**
 * 取得所有 WorkEpic
 * @param isTemplate 是否僅回傳模板型態
 * @returns WorkEpicTemplate 或 WorkEpicEntity 陣列
 */
export async function getAllWorkEpics(isTemplate: boolean): Promise<WorkEpicTemplate[] | WorkEpicEntity[]> {
    const snapshot = await firestoreAdmin.collection("workEpic").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkEpicTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkEpicEntity);
    }
}

/**
 * 新增 WorkEpic 至 Firestore 資料庫
 * @param epic WorkEpicTemplate 或 WorkEpicEntity 物件，包含 Epic 資訊
 * @returns 無回傳值，僅執行新增動作
 */
export async function addWorkEpic(epic: WorkEpicTemplate | WorkEpicEntity): Promise<void> {
    const data: WorkEpicEntity = {
        ...epic,
        createdAt: "createdAt" in epic ? epic.createdAt : new Date().toISOString(),
        owner: "owner" in epic && epic.owner ? epic.owner : { memberId: "", name: "未指定" },
        status: "status" in epic && epic.status ? epic.status : "待開始",
        priority: "priority" in epic && epic.priority ? epic.priority : 1,
        region: "region" in epic && epic.region ? epic.region : "北部",
        address: "address" in epic && epic.address ? epic.address : "未指定",
        siteSupervisors: "siteSupervisors" in epic ? epic.siteSupervisors : [],
        safetyOfficers: "safetyOfficers" in epic ? epic.safetyOfficers : []
    };

    if ("workTypes" in epic) {
        data.workTypes = epic.workTypes || [];
    }
    if ("workFlows" in epic) {
        data.workFlows = epic.workFlows || [];
    }
    if ("workTasks" in epic) {
        data.workTasks = epic.workTasks || [];
    }
    if ("workLoads" in epic) {
        data.workLoads = epic.workLoads || [];
    }

    await firestoreAdmin.collection("workEpic").doc(epic.epicId).set(data);
}

/**
 * 更新指定 WorkEpic 至 Firestore 資料庫
 * @param epicId WorkEpic 的唯一識別碼
 * @param updates 欲更新的 WorkEpicEntity 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkEpic(epicId: string, updates: Partial<WorkEpicEntity>): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epicId).update(updates);
}

/**
 * 從 Firestore 資料庫刪除指定 WorkEpic
 * @param epicId WorkEpic 的唯一識別碼
 * @returns 無回傳值，僅執行刪除動作
 */
export async function deleteWorkEpic(epicId: string): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epicId).delete();
}

/**
 * 取得所有 WorkEpic 的原始資料清單
 * @returns WorkEpicEntity 陣列
 */
export async function listWorkEpic(): Promise<WorkEpicEntity[]> {
    const snapshot = await firestoreAdmin.collection("workEpic").get();
    return snapshot.docs.map(doc => doc.data() as WorkEpicEntity);
}
