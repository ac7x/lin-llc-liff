"use server";

export interface WorkLoadEntity {
    loadId: string;
    taskId: string;
    plannedQuantity: number;
    unit: string;
    plannedStartTime: string;
    plannedEndTime: string;
    actualQuantity: number;
    executor: string[];
    title: string;
    notes?: string;
    epicIds: string[];
}

/**
 * 取得所有 WorkLoad
 * @returns WorkLoadEntity 陣列
 */
export async function getAllWorkLoads(): Promise<WorkLoadEntity[]> {
    const { firestoreAdmin } = await import('@/modules/shared/infrastructure/persistence/firebase-admin/client');
    const snapshot = await firestoreAdmin.collection('workEpic').get();
    const allLoads: WorkLoadEntity[] = [];
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.workLoads)) {
            (data.workLoads as WorkLoadEntity[]).forEach(load => {
                allLoads.push(load);
            });
        }
    });
    return allLoads;
}
