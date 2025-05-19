"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

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
 */
export async function getAllWorkSkills(): Promise<WorkSkill[]> {
    const snapshot = await firestoreAdmin.collection("workSkill").get();
    return snapshot.docs.map(doc => doc.data() as WorkSkill);
}

/**
 * 新增 WorkSkill
 */
export async function addWorkSkill(skill: WorkSkill): Promise<void> {
    await firestoreAdmin.collection("workSkill").doc(skill.skillID).set(skill);
}

/**
 * 更新 WorkSkill
 */
export async function updateWorkSkill(skillID: string, updates: Partial<WorkSkill>): Promise<void> {
    await firestoreAdmin.collection("workSkill").doc(skillID).update(updates);
}

/**
 * 刪除 WorkSkill
 */
export async function deleteWorkSkill(skillID: string): Promise<void> {
    await firestoreAdmin.collection("workSkill").doc(skillID).delete();
}

/**
 * 取得所有 workSkill 的原始資料清單
 */
export async function listWorkSkill(): Promise<WorkSkill[]> {
    const snapshot = await firestoreAdmin.collection("workSkill").get();
    return snapshot.docs.map(doc => doc.data() as WorkSkill);
}
