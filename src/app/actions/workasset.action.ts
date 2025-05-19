"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export interface WorkAsset {
    assetID: string; // 唯一識別碼
    description: string; // 資產描述
    amount: number; // 金額，表示薪資或資產的金額
    currency: string; // 貨幣，例如 "TWD"
    coin: number; // 用戶擁有的虛擬硬幣數量
    diamond: number; // 用戶擁有的虛擬鑽石數量
}

/**
 * 取得所有 WorkAsset
 */
export async function getAllWorkAssets(): Promise<WorkAsset[]> {
    const snapshot = await firestoreAdmin.collection("workAsset").get();
    return snapshot.docs.map(doc => doc.data() as WorkAsset);
}

/**
 * 新增 WorkAsset
 */
export async function addWorkAsset(asset: WorkAsset): Promise<void> {
    await firestoreAdmin.collection("workAsset").doc(asset.assetID).set(asset);
}

/**
 * 更新 WorkAsset
 */
export async function updateWorkAsset(assetID: string, updates: Partial<WorkAsset>): Promise<void> {
    await firestoreAdmin.collection("workAsset").doc(assetID).update(updates);
}

/**
 * 刪除 WorkAsset
 */
export async function deleteWorkAsset(assetID: string): Promise<void> {
    await firestoreAdmin.collection("workAsset").doc(assetID).delete();
}

/**
 * 取得所有 workAsset 的原始資料清單
 */
export async function listWorkAsset(): Promise<WorkAsset[]> {
    const snapshot = await firestoreAdmin.collection("workAsset").get();
    return snapshot.docs.map(doc => doc.data() as WorkAsset);
}
