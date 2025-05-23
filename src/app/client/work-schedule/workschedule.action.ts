'use server'

import { firestoreAdmin } from './database/firebase-admin.client'
import { redisCache } from './database/redis.client'
import type { WorkEpicEntity, WorkLoadEntity } from './types'

const CACHE_KEYS = { ALL_SCHEDULES: 'workEpic:all', SYNC_STATUS: 'workEpic:syncStatus' } as const
const CACHE_TIMES = { FIVE_MINUTES: 300, SYNC_DELAY: 60 } as const

export const getAllWorkSchedules = async (): Promise<WorkEpicEntity[]> => {
    const cached = await redisCache.get(CACHE_KEYS.ALL_SCHEDULES)
    if (cached) {
        try { return JSON.parse(cached) as WorkEpicEntity[] } catch { }
    }
    const snap = await firestoreAdmin.collection('workEpic').get()
    const data = snap.docs.map(doc => doc.data() as WorkEpicEntity)
    await redisCache.set(CACHE_KEYS.ALL_SCHEDULES, JSON.stringify(data), CACHE_TIMES.FIVE_MINUTES)
    return data
}

export const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null,
    epicIds?: string[],
    retryCount = 3
): Promise<WorkLoadEntity | null> => {
    if (!epicId || !loadId || !plannedStartTime) throw new Error('缺少必要參數')
    const finalEpicIds = epicIds?.includes(epicId) ? epicIds : [...(epicIds ?? []), epicId]
    const updateData = { plannedStartTime, plannedEndTime, epicIds: finalEpicIds }
    let success = false, lastError: unknown = null

    for (let i = 0; i < retryCount; i++) {
        try {
            if (await redisCache.updateWorkLoad(epicId, loadId, updateData)) { success = true; break }
            await new Promise(r => setTimeout(r, 500))
        } catch (err) { lastError = err; await new Promise(r => setTimeout(r, 500)) }
    }

    if (!success) {
        try {
            const docRef = firestoreAdmin.collection('workEpic').doc(epicId)
            const doc = await docRef.get()
            if (!doc.exists) throw new Error(`Epic 不存在: ${epicId}`)
            const epic = doc.data() as WorkEpicEntity
            const ws = epic.workLoads ?? []
            const idx = ws.findIndex(w => w.loadId === loadId)
            if (idx === -1) throw new Error(`工作負載不存在: ${loadId}`)
            ws[idx] = { ...ws[idx], ...updateData }
            await docRef.update({ workLoads: ws })
            try {
                const schedules = (await redisCache.getWorkSchedules()).map(e => e.epicId === epicId ? { ...epic, workLoads: ws } : e)
                await redisCache.setWorkSchedules(schedules)
            } catch { }
            return ws[idx]
        } catch (firestoreErr) {
            throw lastError || firestoreErr || new Error('更新失敗')
        }
    }

    const schedules = await redisCache.getWorkSchedules()
    const workLoad = schedules.find(e => e.epicId === epicId)?.workLoads?.find(w => w.loadId === loadId)
    if (!workLoad) throw new Error('找不到更新後的工作負載')
    await scheduleSyncToFirestore(epicId)
    return workLoad
}

async function scheduleSyncToFirestore(epicId: string) {
    const client = await redisCache.getClient()
    const sync = await client.get(CACHE_KEYS.SYNC_STATUS)
    const epicIds = sync ? [...new Set([...JSON.parse(sync).epicIds, epicId])] : [epicId]
    await client.setEx(
        CACHE_KEYS.SYNC_STATUS,
        CACHE_TIMES.SYNC_DELAY,
        JSON.stringify({ epicIds, timestamp: Date.now() })
    )
    if (!sync) setTimeout(syncSchedulesToFirestore, CACHE_TIMES.SYNC_DELAY * 1000)
}

async function syncSchedulesToFirestore() {
    try {
        const client = await redisCache.getClient()
        const sync = await client.get(CACHE_KEYS.SYNC_STATUS)
        if (!sync) return
        const { epicIds } = JSON.parse(sync) as { epicIds: string[] }
        const schedules = await redisCache.getWorkSchedules()
        for (const epicId of epicIds) {
            try {
                const epic = schedules.find(e => e.epicId === epicId)
                if (!epic) continue
                const ref = firestoreAdmin.collection('workEpic').doc(epicId)
                const doc = await ref.get()
                if (!doc.exists) { await ref.set(epic); continue }
                const firestoreData = doc.data() as WorkEpicEntity
                const fsMap = new Map(firestoreData.workLoads?.map(w => [w.loadId, w]) ?? [])
                const merged: WorkLoadEntity[] = [
                    ...(epic.workLoads?.map(w => fsMap.has(w.loadId)
                        ? { ...fsMap.get(w.loadId)!, plannedStartTime: w.plannedStartTime, plannedEndTime: w.plannedEndTime }
                        : w) ?? []),
                    ...[...fsMap.values()].filter(w => !epic.workLoads?.some(ew => ew.loadId === w.loadId))
                ]
                await ref.update({ workLoads: merged })
            } catch { }
        }
        await client.del(CACHE_KEYS.SYNC_STATUS)
    } catch { }
}