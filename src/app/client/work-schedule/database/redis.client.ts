import { createClient } from 'redis'
import type { WorkEpicEntity, WorkLoadEntity } from '../types'

const CACHE_KEYS = { WORK_SCHEDULES: 'workEpic:all', SYNC_FLAG: 'workEpic:needSync' } as const
const DEFAULT_EXPIRE = 300

class RedisClient {
    private static instance: RedisClient
    private client = createClient({ url: process.env.REDIS_URL })
    private connected = false

    private constructor() {
        this.client.on('error', err => console.error('Redis 連線錯誤:', err))
    }

    static getInstance() {
        return this.instance ?? (this.instance = new RedisClient())
    }

    private async ensureConnection() {
        if (!this.connected) {
            await this.client.connect()
            this.connected = true
        }
        return this.client
    }

    async get(key: string) {
        return (await this.ensureConnection()).get(key)
    }

    async set(key: string, value: string, expirationSeconds: number) {
        await (await this.ensureConnection()).setEx(key, expirationSeconds, value)
    }

    async getWorkSchedules(): Promise<WorkEpicEntity[]> {
        const data = await this.get(CACHE_KEYS.WORK_SCHEDULES)
        return data ? JSON.parse(data) : []
    }

    async setWorkSchedules(schedules: WorkEpicEntity[]) {
        await this.set(CACHE_KEYS.WORK_SCHEDULES, JSON.stringify(schedules), DEFAULT_EXPIRE)
    }

    async getClient() {
        return this.ensureConnection()
    }

    async updateWorkLoad(
        epicId: string,
        loadId: string,
        update: Partial<Pick<WorkLoadEntity, 'plannedStartTime' | 'plannedEndTime' | 'epicIds'>>
    ): Promise<boolean> {
        try {
            const schedules = await this.getWorkSchedules()
            const epicIndex = schedules.findIndex(e => e.epicId === epicId)
            if (epicIndex === -1) return false
            const workLoads = schedules[epicIndex].workLoads || []
            const loadIndex = workLoads.findIndex(l => l.loadId === loadId)
            if (loadIndex === -1) return false

            const oldWorkload = workLoads[loadIndex]
            const epicIds = [...(oldWorkload.epicIds || [])]
            if (!epicIds.includes(epicId)) epicIds.push(epicId)

            const updatedWorkLoad = { ...oldWorkload, ...update, epicIds }
            const updatedWorkLoads = [...workLoads]
            updatedWorkLoads[loadIndex] = updatedWorkLoad

            const updatedSchedules = [...schedules]
            updatedSchedules[epicIndex] = { ...schedules[epicIndex], workLoads: updatedWorkLoads }

            await this.setWorkSchedules(updatedSchedules)
            await (await this.ensureConnection()).setEx(CACHE_KEYS.SYNC_FLAG, DEFAULT_EXPIRE, 'true')
            return true
        } catch (error) {
            console.error('Redis updateWorkLoad 失敗:', error)
            throw error
        }
    }
}

export const redisCache = RedisClient.getInstance()