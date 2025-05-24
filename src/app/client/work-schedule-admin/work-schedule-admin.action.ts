"use server";

import type { WorkLoadEntity } from '@/app/actions/workload.action';
import { firestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase-admin/adminApp';

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
