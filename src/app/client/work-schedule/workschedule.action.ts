'use server'

import { firestoreAdmin } from './firebase-admin.client'
import { redisCache } from './redis.client'

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
    const cacheKey = 'workEpic:all'
    // 先查 Redis
    const cached = await redisCache.get(cacheKey)
    if (cached) {
        try {
            return JSON.parse(cached) as WorkEpicEntity[]
        } catch {
            // cache 壞掉 fallback，不需處理錯誤
        }
    }
    // 沒 cache 查 Firestore
    const snapshot = await firestoreAdmin.collection('workEpic').get()
    const data = snapshot.docs.map(doc => doc.data() as WorkEpicEntity)
    // 寫入 Redis，快取 5 分鐘
    await redisCache.set(cacheKey, JSON.stringify(data), 300)
    return data
}

export const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
): Promise<WorkLoadEntity | undefined> => {
    if (!epicId || !loadId || !plannedStartTime) throw new Error('缺少必要參數')
    const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
    let updatedWorkLoad: WorkLoadEntity | undefined

    await firestoreAdmin.runTransaction(async transaction => {
        const epicDoc = await transaction.get(epicRef)
        const epicData = epicDoc.exists ? epicDoc.data() : null
        if (!epicData?.workLoads) return

        const workLoads = [...epicData.workLoads]
        const idx = workLoads.findIndex(wl => wl.loadId === loadId)
        if (idx !== -1) {
            workLoads[idx] = { ...workLoads[idx], plannedStartTime, plannedEndTime }
            updatedWorkLoad = { ...workLoads[idx] }
            transaction.update(epicRef, { workLoads })
        }
    })

    // 更新完畢後，主動清掉相關 Redis 快取（設 1 秒到期即可）
    await redisCache.set('workEpic:all', '', 1)
    return updatedWorkLoad
}