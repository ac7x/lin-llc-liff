"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

/**
 * WorkZoneTemplate 代表工作區域的基本資料結構
 */
export interface WorkZoneTemplate {
    zoneId: string; // 區域唯一識別碼
    title: string; // 區域名稱
    region: "北部" | "中部" | "南部" | "東部" | "離島"; // 所屬區域
}

/**
 * WorkZoneEntity 擴充 WorkZoneTemplate，包含詳細資訊
 */
export interface WorkZoneEntity extends WorkZoneTemplate {
    address: string; // 詳細地址
    description?: string; // 區域描述
    createdAt: string; // 建立時間
    status: "啟用" | "停用"; // 狀態
}

/**
 * 取得所有 WorkZone
 * @param isTemplate 是否僅回傳模板型態
 * @returns WorkZoneTemplate 或 WorkZoneEntity 陣列
 */
export async function getAllWorkZones(isTemplate: boolean = false): Promise<WorkZoneTemplate[] | WorkZoneEntity[]> {
    const snapshot = await firestoreAdmin.collection("workZone").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkZoneTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkZoneEntity);
    }
}

/**
 * 新增 WorkZone 至 Firestore 資料庫
 * @param zone WorkZoneTemplate 或 WorkZoneEntity 物件
 */
export async function addWorkZone(zone: WorkZoneTemplate | WorkZoneEntity): Promise<void> {
    const data: WorkZoneEntity = {
        ...zone,
        createdAt: "createdAt" in zone ? zone.createdAt : new Date().toISOString(),
        address: "address" in zone ? zone.address : "未指定",
        status: "status" in zone ? zone.status : "啟用"
    };
    await firestoreAdmin.collection("workZone").doc(zone.zoneId).set(data);
}

/**
 * 更新指定 WorkZone
 * @param zoneId WorkZone 的唯一識別碼
 * @param updates 欲更新的欄位內容
 */
export async function updateWorkZone(zoneId: string, updates: Partial<WorkZoneEntity>): Promise<void> {
    await firestoreAdmin.collection("workZone").doc(zoneId).update(updates);
}

/**
 * 刪除指定 WorkZone
 * @param zoneId WorkZone 的唯一識別碼
 */
export async function deleteWorkZone(zoneId: string): Promise<void> {
    await firestoreAdmin.collection("workZone").doc(zoneId).delete();
}
