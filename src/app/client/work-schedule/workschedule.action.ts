'use server'

import { firestoreAdmin } from './firebase-admin.client'
import { redisCache } from './redis.client'

const CACHE_KEYS = {
    ALL_SCHEDULES: 'workEpic:all'
} as const

const CACHE_TIMES = {
    FIVE_MINUTES: 300,
    EXPIRE_NOW: 1
} as const

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
 * 取得所有工作排程（支援 Redis 快取）
 */
export const getAllWorkSchedules = async (): Promise<WorkEpicEntity[]> => {
    const cached = await redisCache.get(CACHE_KEYS.ALL_SCHEDULES)
    if (cached) {
        try {
            return JSON.parse(cached) as WorkEpicEntity[]
        } catch {
            // 快取解析失敗，繼續執行查詢
        }
    }

    const snapshot = await firestoreAdmin.collection('workEpic').get()
    const data = snapshot.docs.map(doc => doc.data() as WorkEpicEntity)
    await redisCache.set(CACHE_KEYS.ALL_SCHEDULES, JSON.stringify(data), CACHE_TIMES.FIVE_MINUTES)
    return data
}

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

        workLoads[idx] = { ...workLoads[idx], plannedStartTime, plannedEndTime }
        updatedWorkLoad = workLoads[idx]
        transaction.update(epicRef, { workLoads })
    })

    if (!updatedWorkLoad) {
        throw new Error('更新失敗')
    }

    await redisCache.set(CACHE_KEYS.ALL_SCHEDULES, '', CACHE_TIMES.EXPIRE_NOW)
    return updatedWorkLoad
}