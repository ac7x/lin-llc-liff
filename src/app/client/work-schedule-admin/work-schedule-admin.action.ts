"use server";

import { firestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase-admin/adminApp';
import { FieldValue } from 'firebase-admin/firestore';

export interface TestWorkLoadEntity {
  loadId: string;
  plannedStartTime: string;
  plannedEndTime: string;
  title: string;
}

export interface TestWorkEpicEntity {
  epicId: string;
  title: string;
  workLoads?: TestWorkLoadEntity[];
}

/** 取得所有 Epic 及其工作 */
export async function getAllTestEpics(): Promise<{ epics: TestWorkEpicEntity[] }> {
  const snapshot = await firestoreAdmin.collection('testEpics').get();
  const epics: TestWorkEpicEntity[] = snapshot.docs.map(doc => ({
    ...(doc.data() as object),
    epicId: doc.id
  }) as TestWorkEpicEntity);
  return { epics };
}

/** 新增 Epic */
export async function createTestEpic(title: string): Promise<void> {
  await firestoreAdmin.collection('testEpics').add({
    title,
    workLoads: [],
  });
}

/** 新增工作到指定 Epic */
export async function createTestWorkLoad(epicId: string, title: string, start: string, end: string): Promise<void> {
  const epicRef = firestoreAdmin.collection('testEpics').doc(epicId);
  await epicRef.update({
    workLoads: FieldValue.arrayUnion({
      loadId: Math.random().toString(36).substring(2, 10),
      title,
      plannedStartTime: start,
      plannedEndTime: end,
    }),
  });
}

/** 更新工作位置/時間 */
export async function updateTestWorkLoad(
  fromEpicId: string,
  loadId: string,
  toEpicId: string,
  start: string,
  end: string | null
): Promise<void> {
  if (fromEpicId === toEpicId) {
    const epicRef = firestoreAdmin.collection('testEpics').doc(fromEpicId);
    await firestoreAdmin.runTransaction(async transaction => {
      const epicDoc = await transaction.get(epicRef);
      if (!epicDoc.exists) return;
      const data = epicDoc.data();
      if (!data) return;
      const workLoads: TestWorkLoadEntity[] = Array.isArray(data.workLoads) ? data.workLoads : [];
      const idx = workLoads.findIndex(wl => wl.loadId === loadId);
      if (idx === -1) return;
      workLoads[idx].plannedStartTime = start;
      workLoads[idx].plannedEndTime = end ?? '';
      transaction.update(epicRef, { workLoads });
    });
  } else {
    const fromRef = firestoreAdmin.collection('testEpics').doc(fromEpicId);
    const toRef = firestoreAdmin.collection('testEpics').doc(toEpicId);
    await firestoreAdmin.runTransaction(async transaction => {
      const fromDoc = await transaction.get(fromRef);
      const toDoc = await transaction.get(toRef);
      if (!fromDoc.exists || !toDoc.exists) return;
      const fromData = fromDoc.data();
      const toData = toDoc.data();
      if (!fromData || !toData) return;
      const fromLoads: TestWorkLoadEntity[] = Array.isArray(fromData.workLoads) ? fromData.workLoads : [];
      const toLoads: TestWorkLoadEntity[] = Array.isArray(toData.workLoads) ? toData.workLoads : [];
      const idx = fromLoads.findIndex(wl => wl.loadId === loadId);
      if (idx === -1) return;
      const moved = {
        ...fromLoads[idx],
        plannedStartTime: start,
        plannedEndTime: end ?? ''
      };
      fromLoads.splice(idx, 1);
      toLoads.push(moved);
      transaction.update(fromRef, { workLoads: fromLoads });
      transaction.update(toRef, { workLoads: toLoads });
    });
  }
}

/** 解除排程（清空時間） */
export async function unplanTestWorkLoad(loadId: string): Promise<void> {
  const snapshot = await firestoreAdmin.collection('testEpics').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data) continue;
    const workLoads: TestWorkLoadEntity[] = Array.isArray(data.workLoads) ? data.workLoads : [];
    const idx = workLoads.findIndex(wl => wl.loadId === loadId);
    if (idx !== -1) {
      workLoads[idx].plannedStartTime = '';
      workLoads[idx].plannedEndTime = '';
      await firestoreAdmin.collection('testEpics').doc(doc.id).update({ workLoads });
      break;
    }
  }
}

/** 徹底從陣列移除 */
export async function deleteTestWorkLoad(loadId: string): Promise<void> {
  const snapshot = await firestoreAdmin.collection('testEpics').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data) continue;
    const workLoads: TestWorkLoadEntity[] = Array.isArray(data.workLoads) ? data.workLoads : [];
    const idx = workLoads.findIndex(wl => wl.loadId === loadId);
    if (idx !== -1) {
      const newWorkLoads = [...workLoads];
      newWorkLoads.splice(idx, 1);
      await firestoreAdmin.collection('testEpics').doc(doc.id).update({ workLoads: newWorkLoads });
      break;
    }
  }
}