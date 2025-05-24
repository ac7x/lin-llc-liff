"use server";

import { firestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase-admin/adminApp';

export interface WorkLoadEntity {
  loadId: string;
  plannedStartTime: string;
  plannedEndTime: string;
  title: string;
}

export interface WorkEpicEntity {
  epicId: string;
  title: string;
  workLoads?: WorkLoadEntity[];
}

/** 取得所有 Epic 及其工作 */
export async function getAllEpics(): Promise<{ epics: WorkEpicEntity[] }> {
  const snapshot = await firestoreAdmin.collection('workEpic').get();
  const epics: WorkEpicEntity[] = snapshot.docs.map(doc => ({
    ...(doc.data() as object),
    epicId: doc.id
  }) as WorkEpicEntity);
  return { epics };
}

/** 更新工作位置/時間 */
export async function updateWorkLoad(
  fromEpicId: string,
  loadId: string,
  toEpicId: string,
  start: string,
  end: string | null
): Promise<void> {
  if (fromEpicId === toEpicId) {
    const epicRef = firestoreAdmin.collection('workEpic').doc(fromEpicId);
    await firestoreAdmin.runTransaction(async transaction => {
      const epicDoc = await transaction.get(epicRef);
      if (!epicDoc.exists) return;
      const data = epicDoc.data();
      if (!data) return;
      const workLoads: WorkLoadEntity[] = Array.isArray(data.workLoads) ? data.workLoads : [];
      const idx = workLoads.findIndex(wl => wl.loadId === loadId);
      if (idx === -1) return;
      workLoads[idx].plannedStartTime = start;
      workLoads[idx].plannedEndTime = end ?? '';
      transaction.update(epicRef, { workLoads });
    });
  } else {
    const fromRef = firestoreAdmin.collection('workEpic').doc(fromEpicId);
    const toRef = firestoreAdmin.collection('workEpic').doc(toEpicId);
    await firestoreAdmin.runTransaction(async transaction => {
      const fromDoc = await transaction.get(fromRef);
      const toDoc = await transaction.get(toRef);
      if (!fromDoc.exists || !toDoc.exists) return;
      const fromData = fromDoc.data();
      const toData = toDoc.data();
      if (!fromData || !toData) return;
      const fromLoads: WorkLoadEntity[] = Array.isArray(fromData.workLoads) ? fromData.workLoads : [];
      const toLoads: WorkLoadEntity[] = Array.isArray(toData.workLoads) ? toData.workLoads : [];
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

/** 解除排程（刪除） */
export async function unplanWorkLoad(loadId: string): Promise<void> {
  const snapshot = await firestoreAdmin.collection('workEpic').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data) continue;
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
