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
 */
export async function getAllWorkLevels(): Promise<WorkLevel[]> {
    const snapshot = await firestoreAdmin.collection("workLevel").get();
    return snapshot.docs.map(doc => doc.data() as WorkLevel);
}

/**
 * 新增 WorkLevel
 */
export async function addWorkLevel(level: WorkLevel): Promise<void> {
    await firestoreAdmin.collection("workLevel").doc(level.levelID).set(level);
}

/**
 * 更新 WorkLevel
 */
export async function updateWorkLevel(levelID: string, updates: Partial<WorkLevel>): Promise<void> {
    await firestoreAdmin.collection("workLevel").doc(levelID).update(updates);
}

/**
 * 刪除 WorkLevel
 */
export async function deleteWorkLevel(levelID: string): Promise<void> {
    await firestoreAdmin.collection("workLevel").doc(levelID).delete();
}

/**
 * 取得所有 workLevel 的原始資料清單
 */
export async function listWorkLevel(): Promise<WorkLevel[]> {
    const snapshot = await firestoreAdmin.collection("workLevel").get();
    return snapshot.docs.map(doc => doc.data() as WorkLevel);
}
