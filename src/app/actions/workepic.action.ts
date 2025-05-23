"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/adminApp";
import { WorkFlowEntity } from "./workflow.action";
import { WorkLoadEntity } from "./workload.action";
import { WorkTaskEntity } from "./worktask.action";
import { WorkTypeEntity } from "./worktype.action";
import { WorkZoneEntity } from "./workzone.action";

export interface WorkEpicTemplate {
    epicId: string;
    title: string;
    startDate: string; // ISO 格式
    endDate: string;   // ISO 格式
}

export interface WorkEpicEntity extends WorkEpicTemplate {
    insuranceStatus?: "無" | "有";
    insuranceDate?: string; // ISO 格式
    owner: { memberId: string; name: string };
    siteSupervisors?: { memberId: string; name: string }[];
    safetyOfficers?: { memberId: string; name: string }[];
    status: "待開始" | "進行中" | "已完成" | "已取消";
    priority: number;
    region: "北部" | "中部" | "南部" | "東部" | "離島";
    address: string;
    createdAt: string; // ISO 格式
    workZones?: WorkZoneEntity[];
    workTypes?: WorkTypeEntity[];
    workFlows?: WorkFlowEntity[];
    workTasks?: WorkTaskEntity[];
    workLoads?: WorkLoadEntity[];
}

function toISO(date: any): string {
    if (!date) return "";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        return d.toISOString();
    } catch {
        return "";
    }
}

function fixLoads(loads?: WorkLoadEntity[]): WorkLoadEntity[] {
    if (!loads) return [];
    return loads.map(l => ({
        ...l,
        plannedStartTime: toISO(l.plannedStartTime),
        plannedEndTime: toISO(l.plannedEndTime),
    }));
}

export async function getAllWorkEpics(isTemplate: boolean): Promise<WorkEpicTemplate[] | WorkEpicEntity[]> {
    const snapshot = await firestoreAdmin.collection("workEpic").get();
    if (isTemplate) {
        return snapshot.docs.map(doc => doc.data() as WorkEpicTemplate);
    } else {
        return snapshot.docs.map(doc => doc.data() as WorkEpicEntity);
    }
}

export async function addWorkEpic(epic: WorkEpicTemplate | WorkEpicEntity): Promise<void> {
    const data: WorkEpicEntity = {
        ...epic,
        startDate: toISO(epic.startDate),
        endDate: toISO(epic.endDate),
        insuranceDate: toISO((epic as any).insuranceDate),
        createdAt: "createdAt" in epic ? toISO((epic as any).createdAt) : new Date().toISOString(),
        owner: "owner" in epic && epic.owner ? epic.owner : { memberId: "", name: "未指定" },
        status: "status" in epic && epic.status ? epic.status : "待開始",
        priority: "priority" in epic && epic.priority ? epic.priority : 1,
        region: "region" in epic && epic.region ? epic.region : "北部",
        address: "address" in epic && epic.address ? epic.address : "未指定",
        siteSupervisors: "siteSupervisors" in epic ? epic.siteSupervisors : [],
        safetyOfficers: "safetyOfficers" in epic ? epic.safetyOfficers : []
    };

    if ("workZones" in epic) {
        data.workZones = epic.workZones || [];
    }
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
        data.workLoads = fixLoads(epic.workLoads);
    }

    await firestoreAdmin.collection("workEpic").doc(epic.epicId).set(data);
}

export async function updateWorkEpic(epicId: string, updates: Partial<WorkEpicEntity>): Promise<void> {
    const fixed: Partial<WorkEpicEntity> = {
        ...updates,
    };
    if (typeof updates.startDate !== 'undefined') fixed.startDate = toISO(updates.startDate);
    if (typeof updates.endDate !== 'undefined') fixed.endDate = toISO(updates.endDate);
    if (typeof updates.insuranceDate !== 'undefined') fixed.insuranceDate = toISO(updates.insuranceDate);
    if (typeof updates.createdAt !== 'undefined') fixed.createdAt = toISO(updates.createdAt);
    if (typeof updates.workLoads !== 'undefined') fixed.workLoads = fixLoads(updates.workLoads);

    await firestoreAdmin.collection("workEpic").doc(epicId).update(fixed);
}

export async function deleteWorkEpic(epicId: string): Promise<void> {
    await firestoreAdmin.collection("workEpic").doc(epicId).delete();
}