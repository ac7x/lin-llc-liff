'use server'

import { firestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase-admin/adminApp'

/**
 * 任務負載
 */
export interface WorkLoadEntity {
    loadId: string
    taskId: string
    plannedQuantity: number
    unit: string
    plannedStartTime: string
    plannedEndTime: string
    actualQuantity: number
    executor: string[]
    title: string
    notes?: string
    epicIds: string[]
}

/**
 * 專案標的
 */
export interface WorkEpicEntity {
    epicId: string
    title: string
    startDate: string
    endDate: string
    insuranceStatus?: '無' | '有'
    insuranceDate?: string
    owner: { memberId: string, name: string }
    siteSupervisors?: { memberId: string, name: string }[]
    safetyOfficers?: { memberId: string, name: string }[]
    status: '待開始' | '進行中' | '已完成' | '已取消'
    priority: number
    region: '北部' | '中部' | '南部' | '東部' | '離島'
    address: string
    createdAt: string
    workZones?: unknown[]
    workTypes?: unknown[]
    workFlows?: unknown[]
    workTasks?: unknown[]
    workLoads?: WorkLoadEntity[]
}

/**
 * 取得所有 WorkEpic 及其 WorkLoad
 */
export const getAllWorkSchedules = async (): Promise<WorkEpicEntity[]> => {
    const snapshot = await firestoreAdmin.collection('workEpic').get()
    return snapshot.docs.map(doc => doc.data() as WorkEpicEntity)
}

/**
 * 更新工作負載時間
 */
export const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
): Promise<void> => {
    try {
        if (!epicId || !loadId || !plannedStartTime) {
            throw new Error('缺少必要參數');
        }

        const epicRef = firestoreAdmin.collection('workEpic').doc(epicId);
        await firestoreAdmin.runTransaction(async (transaction) => {
            const epicDoc = await transaction.get(epicRef);
            if (!epicDoc.exists) return;

            const epicData = epicDoc.data();
            if (!epicData || !Array.isArray(epicData.workLoads)) return;

            const workLoads = [...epicData.workLoads];
            const index = workLoads.findIndex(wl => wl.loadId === loadId);
            if (index !== -1) {
                workLoads[index] = {
                    ...workLoads[index],
                    plannedStartTime,
                    plannedEndTime
                };
            }

            transaction.update(epicRef, { workLoads });
        });
    } catch (error) {
        console.error('更新工作負載時間失敗:', error);
        throw error;
    }
}
