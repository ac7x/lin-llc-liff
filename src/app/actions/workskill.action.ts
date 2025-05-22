"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/adminApp";

export interface WorkSkill {
    skillID: string; // 唯一識別碼
    name: string; // 技能名稱，例如 "焊接"、"電器"
    description: string; // 技能的詳細說明
    category: string; // 技能類別，例如 "技術"、"管理"
    level: number; // 技能等級，整數值，表示熟練程度（如 1-10）
    isMandatory: boolean; // 是否必須，表示是否為某些工作類型的必備技能
}

/**
 * 取得所有 WorkSkill
 * @returns WorkSkill 陣列
 */
export async function getAllWorkSkills(): Promise<WorkSkill[]> {
    const snapshot = await firestoreAdmin.collection("workSkill").get();
    return snapshot.docs.map(doc => doc.data() as WorkSkill);
}

/**
 * 新增 WorkSkill 至 Firestore 資料庫
 * @param skill WorkSkill 物件，包含技能資訊
 * @returns 無回傳值，僅執行新增動作
 */
export async function addWorkSkill(skill: WorkSkill): Promise<void> {
    await firestoreAdmin.collection("workSkill").doc(skill.skillID).set(skill);
}

/**
 * 更新指定 WorkSkill 至 Firestore 資料庫
 * @param skillID WorkSkill 的唯一識別碼
 * @param updates 欲更新的 WorkSkill 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkSkill(skillID: string, updates: Partial<WorkSkill>): Promise<void> {
    await firestoreAdmin.collection("workSkill").doc(skillID).update(updates);
}

/**
 * 從 Firestore 資料庫刪除指定 WorkSkill
 * @param skillID WorkSkill 的唯一識別碼
 * @returns 無回傳值，僅執行刪除動作
 */
export async function deleteWorkSkill(skillID: string): Promise<void> {
    await firestoreAdmin.collection("workSkill").doc(skillID).delete();
}
