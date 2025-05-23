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
 */
export const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
): Promise<WorkLoadEntity | null> => {
    if (!epicId || !loadId || !plannedStartTime) {
        throw new Error('缺少必要參數')
    }

    // 1. 更新 Redis
    const success = await redisCache.updateWorkLoad(epicId, loadId, {
        plannedStartTime,
        plannedEndTime
    })

    if (!success) {
        throw new Error('更新失敗')
    }

    // 2. 取得更新後的資料
    const schedules = await redisCache.getWorkSchedules()
    const epic = schedules.find(e => e.epicId === epicId)
    const workLoad = epic?.workLoads?.find(w => w.loadId === loadId)

    if (!workLoad) {
        throw new Error('找不到更新後的工作負載')
    }

    // 3. 排程同步到 Firestore（延遲執行，避免頻繁同步）
    await scheduleSyncToFirestore(epicId)

    return workLoad
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
            const epic = schedules.find(e => e.epicId === epicId)
            if (epic) {
                const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
                await epicRef.set(epic, { merge: true })
            }
        }

        // 清除同步狀態
        await client.del(CACHE_KEYS.SYNC_STATUS)
    } catch (err) {
        console.error('[同步 Firestore 失敗]', err)
    }
}