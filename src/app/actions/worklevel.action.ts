"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkLevel {
    levelID: string; // 唯一識別碼
    title: string; // 等級名稱，例如 "初級"、"高級"
    experiencePoints: number; // 經驗值，用於升級
    nextLevelThreshold: number; // 下一等級門檻，升級所需的經驗值
    rewards: string; // 升級後可獲得的獎勵，例如加薪或新技能解鎖
    maxLevel: number; // 最高等級，固定為 60 級
}

/**
 * 取得所有 WorkLevel
 * @returns WorkLevel 陣列
 */
export async function getAllWorkLevels(): Promise<WorkLevel[]> {
    const snapshot = await firestoreAdmin.collection("workLevel").get();
    return snapshot.docs.map(doc => doc.data() as WorkLevel);
}

/**
 * 新增 WorkLevel 至 Firestore 資料庫
 * @param level WorkLevel 物件，包含等級資訊
 * @returns 無回傳值，僅執行新增動作
 */
export async function addWorkLevel(level: WorkLevel): Promise<void> {
    await firestoreAdmin.collection("workLevel").doc(level.levelID).set(level);
}

/**
 * 更新指定 WorkLevel 至 Firestore 資料庫
 * @param levelID WorkLevel 的唯一識別碼
 * @param updates 欲更新的 WorkLevel 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkLevel(levelID: string, updates: Partial<WorkLevel>): Promise<void> {
    await firestoreAdmin.collection("workLevel").doc(levelID).update(updates);
}

/**
 * 從 Firestore 資料庫刪除指定 WorkLevel
 * @param levelID WorkLevel 的唯一識別碼
 * @returns 無回傳值，僅執行刪除動作
 */
export async function deleteWorkLevel(levelID: string): Promise<void> {
    await firestoreAdmin.collection("workLevel").doc(levelID).delete();
}

/**
 * 取得所有 WorkLevel 的原始資料清單
 * @returns WorkLevel 陣列
 */
export async function listWorkLevel(): Promise<WorkLevel[]> {
    const snapshot = await firestoreAdmin.collection("workLevel").get();
    return snapshot.docs.map(doc => doc.data() as WorkLevel);
}
