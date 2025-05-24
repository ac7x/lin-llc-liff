"use server";

import { firestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase-admin/adminApp';

// 型別定義
export interface WorkLoadEntity {
  loadId: string;
  taskId?: string;
  plannedQuantity?: number;
  unit?: string;
  plannedStartTime: string;
  plannedEndTime: string;
  actualQuantity?: number;
  executor: string[];
  title: string;
  notes?: string;
  epicIds?: string[];
}

export interface WorkEpicEntity {
  epicId: string;
  title: string;
  startDate: string;
  endDate: string;
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
  workZones?: any[];
  workTypes?: any[];
  workFlows?: any[];
  workTasks?: any[];
  workLoads?: WorkLoadEntity[];
}

// 遞迴移除 undefined 屬性
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

// ISO 日期格式安全轉換
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

// 取得所有 Epic 及未排班工作
export async function getAllEpics(): Promise<{ epics: WorkEpicEntity[]; unplanned: (WorkLoadEntity & { epicId: string; epicTitle: string })[] }> {
  const snapshot = await firestoreAdmin.collection('workEpic').get();
  const epics: WorkEpicEntity[] = snapshot.docs.map(doc => ({
    ...doc.data(),
    epicId: doc.id,
  }) as WorkEpicEntity);

  const unplanned = epics.flatMap(e =>
    (e.workLoads || [])
      .filter(l => !l.plannedStartTime || l.plannedStartTime === '')
      .map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
  );

  return { epics, unplanned };
}

// 支援 vis-timeline 實時同步：移動、調整長度、換分組
export async function updateWorkLoad(
  fromEpicId: string, // 原 epicId
  loadId: string,
  toEpicId: string,   // 目的 epicId（可相同）
  start: string,
  end: string | null
): Promise<void> {
  if (fromEpicId === toEpicId) {
    // 僅調整時間
    const epicRef = firestoreAdmin.collection('workEpic').doc(fromEpicId);
    await firestoreAdmin.runTransaction(async transaction => {
      const epicDoc = await transaction.get(epicRef);
      if (!epicDoc.exists) throw new Error('Epic 不存在');
      const data = epicDoc.data();
      const workLoads: WorkLoadEntity[] = Array.isArray(data.workLoads) ? data.workLoads : [];
      const idx = workLoads.findIndex(wl => wl.loadId === loadId);
      if (idx === -1) throw new Error('WorkLoad 不存在');
      workLoads[idx].plannedStartTime = toISO(start);
      workLoads[idx].plannedEndTime = end ? toISO(end) : '';
      transaction.update(epicRef, { workLoads });
    });
  } else {
    // 換分組（Epic）
    const fromRef = firestoreAdmin.collection('workEpic').doc(fromEpicId);
    const toRef = firestoreAdmin.collection('workEpic').doc(toEpicId);
    await firestoreAdmin.runTransaction(async transaction => {
      const fromDoc = await transaction.get(fromRef);
      const toDoc = await transaction.get(toRef);
      if (!fromDoc.exists || !toDoc.exists) throw new Error('Epic 不存在');
      const fromLoads: WorkLoadEntity[] = Array.isArray(fromDoc.data().workLoads) ? fromDoc.data().workLoads : [];
      const toLoads: WorkLoadEntity[] = Array.isArray(toDoc.data().workLoads) ? toDoc.data().workLoads : [];
      const idx = fromLoads.findIndex(wl => wl.loadId === loadId);
      if (idx === -1) throw new Error('WorkLoad 不存在');
      const moved = { ...fromLoads[idx], plannedStartTime: toISO(start), plannedEndTime: end ? toISO(end) : '' };
      fromLoads.splice(idx, 1);
      toLoads.push(moved);
      transaction.update(fromRef, { workLoads: fromLoads });
      transaction.update(toRef, { workLoads: toLoads });
    });
  }
}

// 將工作項目設為未排班（移除排程）
export async function unplanWorkLoad(loadId: string): Promise<void> {
  const snapshot = await firestoreAdmin.collection('workEpic').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const workLoads: WorkLoadEntity[] = Array.isArray(data.workLoads) ? data.workLoads : [];
    const idx = workLoads.findIndex(wl => wl.loadId === loadId);
    if (idx !== -1) {
      workLoads[idx].plannedStartTime = '';
      workLoads[idx].plannedEndTime = '';
      await firestoreAdmin.collection('workEpic').doc(doc.id).update({ workLoads });
      break;
    }
  }
}