"use server";

import type { WorkEpicEntity } from './workepic.action';
import { getAllWorkEpics, updateWorkEpic } from './workepic.action';

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
 * 取得所有 WorkZone（遍歷所有 workEpic 的 workZones 陣列）
 */
export async function getAllWorkZones(): Promise<WorkZoneEntity[]> {
    const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
    return epics.flatMap(e => Array.isArray(e.workZones) ? e.workZones : []);
}

/**
 * 新增 WorkZone 至指定 WorkEpic
 * @param epicId 目標 WorkEpic 的唯一識別碼
 * @param zone WorkZoneEntity 物件
 */
export async function addWorkZone(epicId: string, zone: WorkZoneEntity): Promise<void> {
    const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
    const epic = epics.find(e => e.epicId === epicId);
    if (!epic) throw new Error('找不到對應的 WorkEpic');
    const workZones = Array.isArray(epic.workZones) ? [...epic.workZones, zone] : [zone];
    await updateWorkEpic(epicId, { workZones });
}

/**
 * 更新指定 WorkZone（根據 zoneId）
 * @param epicId 目標 WorkEpic 的唯一識別碼
 * @param zoneId 工作區唯一識別碼
 * @param updates 欲更新內容
 */
export async function updateWorkZone(epicId: string, zoneId: string, updates: Partial<WorkZoneEntity>): Promise<void> {
    const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
    const epic = epics.find(e => e.epicId === epicId);
    if (!epic || !Array.isArray(epic.workZones)) throw new Error('找不到對應的 WorkEpic 或 workZones');
    const workZones = epic.workZones.map((z: WorkZoneEntity) => z.zoneId === zoneId ? { ...z, ...updates } : z);
    await updateWorkEpic(epicId, { workZones });
}

/**
 * 刪除指定 WorkZone（根據 zoneId）
 * @param epicId 目標 WorkEpic 的唯一識別碼
 * @param zoneId 工作區唯一識別碼
 */
export async function deleteWorkZone(epicId: string, zoneId: string): Promise<void> {
    const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
    const epic = epics.find(e => e.epicId === epicId);
    if (!epic || !Array.isArray(epic.workZones)) throw new Error('找不到對應的 WorkEpic 或 workZones');
    const workZones = epic.workZones.filter((z: WorkZoneEntity) => z.zoneId !== zoneId);
    await updateWorkEpic(epicId, { workZones });
}
