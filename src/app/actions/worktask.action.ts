"use server";

export interface WorkTaskEntity {
    taskId: string;
    flowId: string;
    targetQuantity: number;
    unit: string;
    completedQuantity: number;
    title: string;
    status: "待分配" | "執行中" | "已完成";
}

export async function getAllWorkTasks(): Promise<WorkTaskEntity[]> {
    const { firestoreAdmin } = await import('@/modules/shared/infrastructure/persistence/firebase-admin/adminApp');
    const snapshot = await firestoreAdmin.collection('workEpic').get();
    const allTasks: WorkTaskEntity[] = [];
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.workTasks)) {
            (data.workTasks as WorkTaskEntity[]).forEach((task) => allTasks.push(task));
        }
    });
    return allTasks;
}