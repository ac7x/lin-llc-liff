'use server'

import { firestoreAdmin } from './database/firebase-admin.client'
import { redisCache } from './database/redis.client'
import type { WorkEpicEntity, WorkLoadEntity } from './types'

const CACHE_KEYS = {
    ALL_SCHEDULES: 'workEpic:all'
} as const

const CACHE_TIMES = {
    FIVE_MINUTES: 300,
    EXPIRE_NOW: 1
} as const

// Firestore 同步（異步，不阻塞主流程）
async function syncSchedulesToFirestore(schedules: WorkEpicEntity[]) {
    try {
        // 這裡可以根據實際狀況優化，只同步有改動的部份
        for (const epic of schedules) {
            const epicRef = firestoreAdmin.collection('workEpic').doc(epic.epicId)
            await epicRef.set(epic, { merge: true })
        }
    } catch (err) {
        console.error('[同步 Firestore 失敗]', err)
        // 可考慮寫操作日誌或補償
    }
}

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
 * 更新單一工作負載的時間，直接寫 Redis，再同步 Firestore
 */
export const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
): Promise<WorkLoadEntity> => {
    if (!epicId || !loadId || !plannedStartTime) {
        throw new Error('缺少必要參數')
    }
    // 1. 讀 Redis
    const cached = await redisCache.get(CACHE_KEYS.ALL_SCHEDULES)
    let schedules: WorkEpicEntity[] = []
    if (cached) {
        schedules = JSON.parse(cached) as WorkEpicEntity[]
    } else {
        // redis 沒有直接查 Firestore（極少數情況）
        const snapshot = await firestoreAdmin.collection('workEpic').get()
        schedules = snapshot.docs.map(doc => doc.data() as WorkEpicEntity)
    }

    // 2. 找到對應 epic + load
    let updatedWorkLoad: WorkLoadEntity | undefined = undefined
    schedules = schedules.map(epic => {
        if (epic.epicId !== epicId) return epic
        if (!epic.workLoads) return epic
        epic.workLoads = epic.workLoads.map(load => {
            if (load.loadId !== loadId) return load
            updatedWorkLoad = {
                ...load,
                plannedStartTime,
                plannedEndTime: plannedEndTime || null
            }
            return updatedWorkLoad
        })
        return epic
    })

    if (!updatedWorkLoad) {
        throw new Error('找不到指定的工作負載')
    }

    // 3. 寫回 Redis
    await redisCache.set(CACHE_KEYS.ALL_SCHEDULES, JSON.stringify(schedules), CACHE_TIMES.FIVE_MINUTES)
    // 4. fire-and-forget 同步 Firestore
    syncSchedulesToFirestore(schedules)
    // 5. 回傳
    return updatedWorkLoad
}