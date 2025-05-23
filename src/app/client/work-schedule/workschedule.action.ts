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

/**
 * 取得所有工作排程（支援 Redis 快取）
 * 只在 server 端執行，快取內容為 JSON 字串
 */
export const getAllWorkSchedules = async (): Promise<WorkEpicEntity[]> => {
    const cached = await redisCache.get(CACHE_KEYS.ALL_SCHEDULES)
    if (cached) {
        try {
            return JSON.parse(cached) as WorkEpicEntity[]
        } catch {
            // 快取解析失敗，繼續查詢 Firestore
        }
    }

    const snapshot = await firestoreAdmin.collection('workEpic').get()
    const data = snapshot.docs.map(doc => doc.data() as WorkEpicEntity)
    await redisCache.set(CACHE_KEYS.ALL_SCHEDULES, JSON.stringify(data), CACHE_TIMES.FIVE_MINUTES)
    return data
}

/**
 * 更新單一工作負載的時間，並清除快取
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

    const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
    let updatedWorkLoad: WorkLoadEntity | undefined

    await firestoreAdmin.runTransaction(async transaction => {
        const epicDoc = await transaction.get(epicRef)
        const epicData = epicDoc.data()

        if (!epicDoc.exists || !epicData?.workLoads) {
            throw new Error('找不到指定的工作項目')
        }

        const workLoads = epicData.workLoads as WorkLoadEntity[]
        const idx = workLoads.findIndex(wl => wl.loadId === loadId)

        if (idx === -1) {
            throw new Error('找不到指定的工作負載')
        }

        workLoads[idx] = {
            ...workLoads[idx],
            plannedStartTime,
            plannedEndTime: plannedEndTime || null
        }
        updatedWorkLoad = workLoads[idx]
        transaction.update(epicRef, { workLoads })
    })

    if (!updatedWorkLoad) {
        throw new Error('更新失敗')
    }

    // 清除快取，確保下次查詢拿到最新資料
    await redisCache.set(CACHE_KEYS.ALL_SCHEDULES, '', CACHE_TIMES.EXPIRE_NOW)
    return updatedWorkLoad
}
