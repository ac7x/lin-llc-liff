"use server";

import { firestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase-admin/adminApp';
import { WorkFlowEntity } from './workflow.action';
import { WorkLoadEntity } from './workload.action';
import { WorkTaskEntity } from './worktask.action';
import { WorkTypeEntity } from './worktype.action';
import { WorkZoneEntity } from './workzone.action';

export interface WorkEpicTemplate {
    epicId: string;
    title: string;
    startDate: string;
    endDate: string;
}

export interface WorkEpicEntity extends WorkEpicTemplate {
    insuranceStatus?: '無' | '有';
    insuranceDate?: string;
    owner: { memberId: string; name: string };
    siteSupervisors?: { memberId: string; name: string }[];
    safetyOfficers?: { memberId: string; name: string }[];
    status: '待開始' | '進行中' | '已完成' | '已取消';
    priority: number;
    region: '北部' | '中部' | '南部' | '東部' | '離島';
    address: string;
    createdAt: string;
    workZones?: WorkZoneEntity[];
    workTypes?: WorkTypeEntity[];
    workFlows?: WorkFlowEntity[];
    workTasks?: WorkTaskEntity[];
    workLoads?: WorkLoadEntity[];
}

function toISO(date: string | number | Date | undefined | null): string {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toISOString();
}

function fixLoads(loads?: WorkLoadEntity[]): WorkLoadEntity[] {
    return (loads || []).map(l => ({
        ...l,
        plannedStartTime: toISO(l.plannedStartTime),
        plannedEndTime: toISO(l.plannedEndTime)
    }));
}

export async function getAllWorkEpics(isTemplate: boolean): Promise<WorkEpicTemplate[] | WorkEpicEntity[]> {
    const snapshot = await firestoreAdmin.collection('workEpic').get();
    return isTemplate
        ? snapshot.docs.map(doc => doc.data() as WorkEpicTemplate)
        : snapshot.docs.map(doc => doc.data() as WorkEpicEntity);
}

export async function addWorkEpic(epic: WorkEpicTemplate | WorkEpicEntity): Promise<void> {
    const data: WorkEpicEntity = {
        ...epic,
        startDate: toISO(epic.startDate),
        endDate: toISO(epic.endDate),
        insuranceDate: 'insuranceDate' in epic ? toISO(epic.insuranceDate) : undefined,
        createdAt: 'createdAt' in epic && epic.createdAt ? toISO(epic.createdAt) : new Date().toISOString(),
        owner: 'owner' in epic && epic.owner ? epic.owner : { memberId: '', name: '未指定' },
        status: 'status' in epic && epic.status ? epic.status : '待開始',
        priority: 'priority' in epic && epic.priority ? epic.priority : 1,
        region: 'region' in epic && epic.region ? epic.region : '北部',
        address: 'address' in epic && epic.address ? epic.address : '未指定',
        siteSupervisors: 'siteSupervisors' in epic ? epic.siteSupervisors : [],
        safetyOfficers: 'safetyOfficers' in epic ? epic.safetyOfficers : [],
        workZones: 'workZones' in epic ? epic.workZones || [] : [],
        workTypes: 'workTypes' in epic ? epic.workTypes || [] : [],
        workFlows: 'workFlows' in epic ? epic.workFlows || [] : [],
        workTasks: 'workTasks' in epic ? epic.workTasks || [] : [],
        workLoads: 'workLoads' in epic ? fixLoads(epic.workLoads) : [],
    };
    await firestoreAdmin.collection('workEpic').doc(epic.epicId).set(data);
}

export async function updateWorkEpic(epicId: string, updates: Partial<WorkEpicEntity>): Promise<void> {
    const fixed: Partial<WorkEpicEntity> = { ...updates };
    if (updates.startDate) fixed.startDate = toISO(updates.startDate);
    if (updates.endDate) fixed.endDate = toISO(updates.endDate);
    if (updates.insuranceDate) fixed.insuranceDate = toISO(updates.insuranceDate);
    if (updates.createdAt) fixed.createdAt = toISO(updates.createdAt);
    if (updates.workLoads) fixed.workLoads = fixLoads(updates.workLoads);
    await firestoreAdmin.collection('workEpic').doc(epicId).update(fixed);
}

export async function deleteWorkEpic(epicId: string): Promise<void> {
    await firestoreAdmin.collection('workEpic').doc(epicId).delete();
}