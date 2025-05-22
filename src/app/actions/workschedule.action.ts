// src/modules/shared/application/workschedule.action.ts
import { redisCache } from "@/modules/shared/infrastructure/cache/redis/client";
import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

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
 * 拖曳/調整任務排程：可選擇先寫 Redis，再同步 Firestore
 */
export async function updateWorkLoadTime(
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
    options: { toCache?: boolean; toFirestore?: boolean } = { toCache: true, toFirestore: true }
): Promise<void> {
    // 1. 先寫入 Redis（快取，低延遲）
    if (options.toCache) {
        const data: Record<string, string> = {
            plannedStartTime,
            plannedEndTime: plannedEndTime ?? "",
        };
        await redisCache.hset(`workschedule:${epicId}:${loadId}`, data);
        await redisCache.set(
            `workschedule:touch:${epicId}`,
            Date.now().toString(),
            3600
        ); // 標記有異動
    }

    // 2. 寫入 Firestore（資料最終一致）
    if (options.toFirestore) {
        const epicRef = firestoreAdmin.collection("workEpic").doc(epicId);
        const epicSnap = await epicRef.get();
        if (!epicSnap.exists) throw new Error("Epic not found");
        const epicData = epicSnap.data();
        if (!epicData || !Array.isArray(epicData.workLoads)) throw new Error("Epic data or workLoads undefined");

        const newWorkLoads = epicData.workLoads.map((wl: WorkLoadEntity) =>
            wl.loadId === loadId
                ? { ...wl, plannedStartTime, plannedEndTime: plannedEndTime ?? "" }
                : wl
        );
        await epicRef.update({ workLoads: newWorkLoads });
    }
}

/**
 * 把 Redis 快取的所有 workload 異動批次同步回 Firestore
 * 通常排程任務或管理介面調用
 */
export async function syncWorkScheduleCacheToFirestore(epicId: string): Promise<void> {
    // 動態取得 Redis client keys
    const { createClient } = await import('redis');
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();

    const keys = await client.keys(`workschedule:${epicId}:*`);
    if (!keys.length) {
        await client.quit();
        return;
    }

    // 2. 彙整所有 workload
    const cacheData: Record<string, Partial<Pick<WorkLoadEntity, "plannedStartTime" | "plannedEndTime">>> = {};
    for (const key of keys) {
        const segments = key.split(":");
        const loadId = segments[2];
        const data = await redisCache.hgetall(key);
        cacheData[loadId] = {
            plannedStartTime: data.plannedStartTime,
            plannedEndTime: data.plannedEndTime,
        };
    }

    // 3. 取 Firestore 現有 workLoads
    const epicRef = firestoreAdmin.collection("workEpic").doc(epicId);
    const epicSnap = await epicRef.get();
    if (!epicSnap.exists) {
        await client.quit();
        throw new Error("Epic not found");
    }
    const epicData = epicSnap.data();
    if (!epicData || !Array.isArray(epicData.workLoads)) {
        await client.quit();
        throw new Error("Epic data or workLoads undefined");
    }
    const workLoads = epicData.workLoads.map((wl: WorkLoadEntity) =>
        cacheData[wl.loadId]
            ? { ...wl, ...cacheData[wl.loadId] }
            : wl
    );

    // 4. 寫回 Firestore
    await epicRef.update({ workLoads });

    // 5. 清 Redis
    for (const key of keys) {
        await redisCache.del(key);
    }

    await client.quit();
}