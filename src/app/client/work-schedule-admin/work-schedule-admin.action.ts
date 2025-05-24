"use server";

import type { WorkFlowEntity } from '@/app/actions/workflow.action';
import type { WorkLoadEntity } from '@/app/actions/workload.action';
import type { WorkTaskEntity } from '@/app/actions/worktask.action';
import type { WorkTypeEntity } from '@/app/actions/worktype.action';
import type { WorkZoneEntity } from '@/app/actions/workzone.action';

// --- Firebase Admin 客戶端（單例）實現開始 ---
import admin from 'firebase-admin';

/**
 * Firebase Admin 客戶端（單例）
 * 初始化 Firebase Admin SDK 並提供 Firestore 操作
 */
class FirebaseAdminClient {
  private static instance: FirebaseAdminClient;
  private firestore: admin.firestore.Firestore;

  private constructor() {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.firestore = admin.firestore();
  }

  /**
   * 取得單例實例
   */
  static getInstance(): FirebaseAdminClient {
    return this.instance ?? (this.instance = new FirebaseAdminClient());
  }

  /**
   * 取得 Firestore 實例
   */
  getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }
}

const firebaseAdminClient = FirebaseAdminClient.getInstance();
const firestoreAdmin = firebaseAdminClient.getFirestore();
// --- Firebase Admin 客戶端（單例）實現結束 ---

/**
 * 新增 WorkLoad 到指定 Epic
 */
export async function addWorkLoadToEpic(epicId: string, load: WorkLoadEntity): Promise<void> {
  const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
  await firestoreAdmin.runTransaction(async transaction => {
    const epicDoc = await transaction.get(epicRef)
    const data = epicDoc.exists ? epicDoc.data() : undefined
    if (!data) throw new Error('Epic 不存在')
    const workLoads = Array.isArray(data.workLoads) ? [...data.workLoads, load] : [load]
    transaction.update(epicRef, { workLoads })
  })
}

/**
 * 取得所有 WorkEpic
 */
export async function getAllWorkEpics(isTemplate: boolean): Promise<WorkEpicTemplate[] | WorkEpicEntity[]> {
  const snapshot = await firestoreAdmin.collection('workEpic').get();
  return isTemplate
    ? snapshot.docs.map(doc => doc.data() as WorkEpicTemplate)
    : snapshot.docs.map(doc => doc.data() as WorkEpicEntity);
}

/**
 * 新增 WorkEpic
 */
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
  await firestoreAdmin.collection('workEpic').doc(epic.epicId).set(removeUndefined(data));
}

// --- WorkEpic 型別定義與工具函式 ---

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

function removeUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as unknown as T;
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        (acc as Record<string, unknown>)[key] = removeUndefined(value);
      }
      return acc;
    }, {} as T);
  }
  return obj;
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
