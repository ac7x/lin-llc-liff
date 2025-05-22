'use server'

import { redisCache } from '@/modules/shared/infrastructure/cache/redis/client'
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
 * 取得所有 WorkEpic 及其 WorkLoad（含 Redis 快取異動合併）
 */
export const getAllWorkSchedulesWithCache = async (): Promise<WorkEpicEntity[]> => {
    // 先撈 Firestore
    const snapshot = await firestoreAdmin.collection('workEpic').get()
    const epicList: WorkEpicEntity[] = snapshot.docs.map(doc => doc.data() as WorkEpicEntity)

    // 合併 Redis 快取異動
    for (const epic of epicList) {
        if (!epic.epicId || !Array.isArray(epic.workLoads) || !epic.workLoads.length) continue

        // 針對每個 workLoad 試著抓 Redis 快取
        for (let i = 0; i < epic.workLoads.length; i++) {
            const wl = epic.workLoads[i]
            const redisKey = `workschedule:${epic.epicId}:${wl.loadId}`
            const cacheData = await redisCache.hgetall(redisKey)
            if (cacheData && Object.keys(cacheData).length > 0) {
                epic.workLoads[i] = {
                    ...wl,
                    plannedStartTime: cacheData.plannedStartTime || wl.plannedStartTime,
                    plannedEndTime: cacheData.plannedEndTime || wl.plannedEndTime,
                }
            }
        }
    }
    return epicList
}

/**
 * 取得所有 WorkEpic 及其 WorkLoad（僅 Firestore，無合併快取）
 */
export const getAllWorkSchedules = async (): Promise<WorkEpicEntity[]> => {
    const snapshot = await firestoreAdmin.collection('workEpic').get()
    return snapshot.docs.map(doc => doc.data() as WorkEpicEntity)
}

/**
 * 更新工作負載時間（可選擇同步 Redis 與 Firestore）
 */
export const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
    options: { toCache?: boolean, toFirestore?: boolean } = { toCache: true, toFirestore: true }
): Promise<void> => {
    if (options.toCache) {
        await redisCache.hset(`workschedule:${epicId}:${loadId}`, {
            plannedStartTime,
            plannedEndTime: plannedEndTime ?? ''
        })
        await redisCache.set(`workschedule:touch:${epicId}`, Date.now().toString(), 3600)
    }
    if (options.toFirestore) {
        const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
        const epicSnap = await epicRef.get()
        if (!epicSnap.exists) throw new Error('Epic not found')
        const epicData = epicSnap.data()
        if (!epicData || !Array.isArray(epicData.workLoads)) throw new Error('Epic data or workLoads undefined')

        const newWorkLoads = epicData.workLoads.map((wl: WorkLoadEntity) =>
            wl.loadId === loadId
                ? { ...wl, plannedStartTime, plannedEndTime: plannedEndTime ?? '' }
                : wl
        )
        await epicRef.update({ workLoads: newWorkLoads })
    }
}

/**
 * 將 Redis 快取的 workload 異動批次同步回 Firestore
 */
export const syncWorkScheduleCacheToFirestore = async (epicId: string): Promise<void> => {
    const { createClient } = await import('redis')
    const client = createClient({ url: process.env.REDIS_URL })
    await client.connect()

    const keys = await client.keys(`workschedule:${epicId}:*`)
    if (!keys.length) {
        await client.quit()
        return
    }
    const cacheData: Record<string, Partial<Pick<WorkLoadEntity, 'plannedStartTime' | 'plannedEndTime'>>> = {}
    for (const key of keys) {
        const segments = key.split(':')
        const loadId = segments[2]
        const data = await redisCache.hgetall(key)
        cacheData[loadId] = {
            plannedStartTime: data.plannedStartTime,
            plannedEndTime: data.plannedEndTime
        }
    }
    const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
    const epicSnap = await epicRef.get()
    if (!epicSnap.exists) {
        await client.quit()
        throw new Error('Epic not found')
    }
    const epicData = epicSnap.data()
    if (!epicData || !Array.isArray(epicData.workLoads)) {
        await client.quit()
        throw new Error('Epic data or workLoads undefined')
    }
    const workLoads = epicData.workLoads.map((wl: WorkLoadEntity) =>
        cacheData[wl.loadId]
            ? { ...wl, ...cacheData[wl.loadId] }
            : wl
    )
    await epicRef.update({ workLoads })
    for (const key of keys) {
        await redisCache.del(key)
    }
    await client.quit()
}