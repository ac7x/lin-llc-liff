"use server";

import type { WorkEpicEntity } from './workepic.action';
import { getAllWorkEpics, updateWorkEpic } from './workepic.action';

export interface WorkZoneTemplate {
    zoneId: string;
    title: string;
    region: "北部" | "中部" | "南部" | "東部" | "離島";
}
export interface WorkZoneEntity extends WorkZoneTemplate {
    address: string;
    description?: string;
    createdAt: string;
    status: "啟用" | "停用";
}

export async function getAllWorkZones(): Promise<WorkZoneEntity[]> {
    const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
    return epics.flatMap(e => Array.isArray(e.workZones) ? e.workZones : []);
}

export async function addWorkZone(epicId: string, zone: WorkZoneEntity): Promise<void> {
    const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
    const epic = epics.find(e => e.epicId === epicId);
    if (!epic) throw new Error('找不到對應的 WorkEpic');
    const workZones = Array.isArray(epic.workZones) ? [...epic.workZones, zone] : [zone];
    await updateWorkEpic(epicId, { workZones });
}

export async function updateWorkZone(epicId: string, zoneId: string, updates: Partial<WorkZoneEntity>): Promise<void> {
    const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
    const epic = epics.find(e => e.epicId === epicId);
    if (!epic || !Array.isArray(epic.workZones)) throw new Error('找不到對應的 WorkEpic 或 workZones');
    const workZones = epic.workZones.map((z: WorkZoneEntity) => z.zoneId === zoneId ? { ...z, ...updates } : z);
    await updateWorkEpic(epicId, { workZones });
}

export async function deleteWorkZone(epicId: string, zoneId: string): Promise<void> {
    const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
    const epic = epics.find(e => e.epicId === epicId);
    if (!epic || !Array.isArray(epic.workZones)) throw new Error('找不到對應的 WorkEpic 或 workZones');
    const workZones = epic.workZones.filter((z: WorkZoneEntity) => z.zoneId !== zoneId);
    await updateWorkEpic(epicId, { workZones });
}