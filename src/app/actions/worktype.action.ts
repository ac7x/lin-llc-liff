"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/adminApp";
import type { WorkFlowEntity } from "./workflow.action";

/**
 * WorkTypeTemplate 介面，代表一個工作類型的基本資料結構。
 * @property {string} typeId - 唯一識別碼
 * @property {string} title - 標題
 * @property {string[]} requiredSkills - 所需技能
 */
export interface WorkTypeTemplate {
    typeId: string; // 唯一識別碼
    title: string; // 標題
    requiredSkills: string[]; // 所需技能
}

/**
 * WorkTypeEntity 介面，擴充 WorkTypeTemplate，包含預設關聯的工作流程。
 * @property {string} [defaultWorkflow] - 預設關聯的 WorkFlow
 * @property {WorkFlowEntity[]} [flows] - 工作流程模板陣列
 */
export interface WorkTypeEntity extends WorkTypeTemplate {
    defaultWorkflow?: string; // 預設關聯的 WorkFlow
    /**
     * flows: 工作流程模板陣列，直接寫在工作類型下
     */
    flows?: WorkFlowEntity[];
}

/**
 * WorkType 型別，代表 WorkTypeTemplate 或 WorkTypeEntity。
 */
export type WorkType = WorkTypeTemplate | WorkTypeEntity;

/**
 * 取得所有 WorkType
 * @param {boolean} [isEntity=false] - 是否回傳 WorkTypeEntity 型別
 * @returns {Promise<WorkTypeTemplate[] | WorkTypeEntity[]>} 所有工作類型清單
 */
export async function getAllWorkTypes(isEntity: boolean = false): Promise<WorkTypeTemplate[] | WorkTypeEntity[]> {
    const snapshot = await firestoreAdmin.collection("workType").get();
    if (isEntity) {
        return snapshot.docs.map(doc => doc.data() as WorkTypeEntity);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkTypeTemplate);
    }
}

/**
 * 新增或覆蓋一個工作類型。
 * @param {WorkTypeTemplate | WorkTypeEntity} type - 要新增的工作類型資料
 * @returns {Promise<void>}
 */
export async function addWorkType(type: WorkTypeTemplate | WorkTypeEntity): Promise<void> {
    await firestoreAdmin.collection("workType").doc(type.typeId).set(type);
}

/**
 * 更新指定的工作類型資料。
 * @param {string} typeId - 工作類型的唯一識別碼
 * @param {Partial<WorkTypeEntity>} updates - 欲更新的欄位
 * @returns {Promise<void>}
 */
export async function updateWorkType(typeId: string, updates: Partial<WorkTypeEntity>): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).update(updates);
}

/**
 * 刪除指定的工作類型。
 * @param {string} typeId - 工作類型的唯一識別碼
 * @returns {Promise<void>}
 */
export async function deleteWorkType(typeId: string): Promise<void> {
    await firestoreAdmin.collection("workType").doc(typeId).delete();
}
