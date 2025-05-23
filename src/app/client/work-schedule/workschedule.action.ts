'use server'

import { firestoreAdmin } from './database/firebase-admin.client'
import { redisCache } from './database/redis.client'
import type { WorkEpicEntity, WorkLoadEntity } from './types'

const CACHE_KEYS = {
    ALL_SCHEDULES: 'workEpic:all',
    SYNC_STATUS: 'workEpic:syncStatus'
} as const

const CACHE_TIMES = {
    FIVE_MINUTES: 300,
    SYNC_DELAY: 60  // 同步延遲 1 分鐘
} as const

/**
 * 取得所有工作排程（直接從 Redis 拿）
 */
export const getAllWorkSchedules = async (): Promise<WorkEpicEntity[]> => {
    const cached = await redisCache.get(CACHE_KEYS.ALL_SCHEDULES)
    if (cached) {
        try {
            return JSON.parse(cached) as WorkEpicEntity[]
        } catch {
            // 快取格式錯誤，繼續查 Firestore 並重建 Redis
        }
    }
    // Redis 沒有 -> 查 Firestore，並寫回 Redis
    const snapshot = await firestoreAdmin.collection('workEpic').get()
    const data = snapshot.docs.map(doc => doc.data() as WorkEpicEntity)
    await redisCache.set(CACHE_KEYS.ALL_SCHEDULES, JSON.stringify(data), CACHE_TIMES.FIVE_MINUTES)
    return data
}

/**
 * 更新單一工作負載的時間，直接寫 Redis，並觸發同步
 * 新增重試機制和直接寫入 Firestore 的備選方案
 */
export const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
    retryCount = 3
): Promise<WorkLoadEntity | null> => {
    if (!epicId || !loadId || !plannedStartTime) {
        throw new Error('缺少必要參數')
    }

    // 準備要更新的資料
    const updateData = {
        plannedStartTime,
        plannedEndTime
    };

    // 1. 嘗試使用 Redis 更新，具有重試機制
    let success = false;
    let lastError = null;

    for (let i = 0; i < retryCount; i++) {
        try {
            // 嘗試更新 Redis
            success = await redisCache.updateWorkLoad(epicId, loadId, updateData);
            if (success) break; // 如果成功就跳出循環

            console.log(`Redis 更新嘗試 ${i + 1}/${retryCount} 失敗，正在重試...`);
            // 短暫等待後重試
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
            lastError = err;
            console.error(`Redis 更新嘗試 ${i + 1}/${retryCount} 發生錯誤:`, err);
            // 短暫等待後重試
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // 如果 Redis 全部嘗試都失敗，則直接嘗試更新 Firestore
    if (!success) {
        console.warn('Redis 更新失敗，直接嘗試更新 Firestore');
        try {
            // 先讀取 Firestore 資料
            const docRef = firestoreAdmin.collection('workEpic').doc(epicId);
            const epicDoc = await docRef.get();

            if (!epicDoc.exists) {
                throw new Error(`Epic 不存在: ${epicId}`);
            }

            const epicData = epicDoc.data() as WorkEpicEntity;
            const workLoads = epicData.workLoads || [];
            const loadIndex = workLoads.findIndex(w => w.loadId === loadId);

            if (loadIndex === -1) {
                throw new Error(`工作負載不存在: ${loadId}`);
            }

            // 更新工作負載
            workLoads[loadIndex] = {
                ...workLoads[loadIndex],
                ...updateData
            };

            // 直接寫回 Firestore
            await docRef.update({ workLoads });

            // 更新成功後，同步回 Redis
            try {
                const updatedEpic = { ...epicData, workLoads };
                const cachedSchedules = await redisCache.getWorkSchedules();
                const updatedSchedules = cachedSchedules.map(e =>
                    e.epicId === epicId ? updatedEpic : e
                );
                await redisCache.setWorkSchedules(updatedSchedules);
            } catch (redisErr) {
                // Redis 同步失敗不影響主流程，僅記錄
                console.error('Redis 同步更新後資料失敗:', redisErr);
            }

            return workLoads[loadIndex];
        } catch (firestoreErr) {
            // Firestore 也失敗，拋出原始 Redis 錯誤
            console.error('Firestore 直接更新也失敗:', firestoreErr);
            throw lastError || new Error('更新失敗（Redis 和 Firestore 都失敗）');
        }
    }

    // 2. 取得更新後的資料
    const schedules = await redisCache.getWorkSchedules();
    const epic = schedules.find(e => e.epicId === epicId);
    const workLoad = epic?.workLoads?.find(w => w.loadId === loadId);

    if (!workLoad) {
        throw new Error('找不到更新後的工作負載');
    }

    // 3. 排程同步到 Firestore（延遲執行，避免頻繁同步）
    await scheduleSyncToFirestore(epicId);

    return workLoad;
}

/**
 * 排程同步到 Firestore
 */
async function scheduleSyncToFirestore(epicId: string) {
    const client = await redisCache.getClient()
    const syncStatus = await client.get(CACHE_KEYS.SYNC_STATUS)

    // 已有同步排程，更新同步狀態即可
    if (syncStatus) {
        const status = JSON.parse(syncStatus)
        status.epicIds = [...new Set([...status.epicIds, epicId])]
        await client.setEx(
            CACHE_KEYS.SYNC_STATUS,
            CACHE_TIMES.SYNC_DELAY,
            JSON.stringify(status)
        )
        return
    }

    // 設定新的同步狀態
    const newStatus = { epicIds: [epicId], timestamp: Date.now() }
    await client.setEx(
        CACHE_KEYS.SYNC_STATUS,
        CACHE_TIMES.SYNC_DELAY,
        JSON.stringify(newStatus)
    )

    // 延遲同步，等待可能的其他更新
    setTimeout(async () => {
        await syncSchedulesToFirestore()
    }, CACHE_TIMES.SYNC_DELAY * 1000)
}

/**
 * 執行同步到 Firestore
 */
async function syncSchedulesToFirestore() {
    try {
        const client = await redisCache.getClient()
        const syncStatus = await client.get(CACHE_KEYS.SYNC_STATUS)
        if (!syncStatus) return

        const { epicIds } = JSON.parse(syncStatus)
        const schedules = await redisCache.getWorkSchedules()

        // 只同步需要更新的 epics
        for (const epicId of epicIds) {
            try {
                const epic = schedules.find(e => e.epicId === epicId)
                if (!epic) {
                    console.warn(`[同步 Firestore] 找不到 epicId: ${epicId}`)
                    continue
                }

                // 取得最新的 Firestore 資料進行比較，避免覆蓋其他更新
                const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
                const firestoreDoc = await epicRef.get()

                if (!firestoreDoc.exists) {
                    console.warn(`[同步 Firestore] Firestore 中不存在 epicId: ${epicId}，執行完整寫入`)
                    await epicRef.set(epic)
                    continue
                }

                // 智能合併工作負載資料：僅更新 plannedStartTime 和 plannedEndTime
                const firestoreData = firestoreDoc.data() as WorkEpicEntity

                // 創建一個工作負載 ID 到物件的映射，用於快速查找
                const firestoreWorkLoadsMap = new Map<string, WorkLoadEntity>()
                firestoreData.workLoads?.forEach(wl => {
                    if (wl.loadId) firestoreWorkLoadsMap.set(wl.loadId, wl)
                })

                // 創建更新後的工作負載陣列，確保不會遺漏任何項目
                const updatedWorkLoads: WorkLoadEntity[] = []

                // 處理 Redis 中存在的所有工作負載
                epic.workLoads?.forEach(workLoad => {
                    if (!workLoad.loadId) return

                    const existingWorkLoad = firestoreWorkLoadsMap.get(workLoad.loadId)
                    if (existingWorkLoad) {
                        // 如果 Firestore 中存在此工作負載，則合併資料，優先使用 Redis 中的計畫時間
                        updatedWorkLoads.push({
                            ...existingWorkLoad,
                            plannedStartTime: workLoad.plannedStartTime,
                            plannedEndTime: workLoad.plannedEndTime
                        })
                        // 從映射中移除已處理的項目
                        firestoreWorkLoadsMap.delete(workLoad.loadId)
                    } else {
                        // 如果 Firestore 中不存在，則添加新的工作負載
                        updatedWorkLoads.push(workLoad)
                    }
                })

                // 添加 Firestore 中存在但 Redis 中不存在的工作負載（避免資料遺失）
                firestoreWorkLoadsMap.forEach(wl => {
                    updatedWorkLoads.push(wl)
                })

                // 更新 Firestore，僅更新工作負載陣列
                await epicRef.update({ workLoads: updatedWorkLoads })
                console.log(`[同步 Firestore] 成功同步 epicId: ${epicId}`)
            } catch (epicError) {
                // 單個 epic 更新失敗不應中斷整個同步過程
                console.error(`[同步 Firestore] 更新 epicId: ${epicId} 失敗:`, epicError)
            }
        }

        // 清除同步狀態
        await client.del(CACHE_KEYS.SYNC_STATUS)
        console.log('[同步 Firestore] 完成同步')
    } catch (err) {
        console.error('[同步 Firestore 失敗]', err)
        // 同步失敗不拋出錯誤，避免影響使用者體驗，但會保留同步狀態以便下次重試
    }
}