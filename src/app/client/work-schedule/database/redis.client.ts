import { createClient } from 'redis'
import type { WorkEpicEntity, WorkLoadEntity } from '../types'

const CACHE_KEYS = {
    WORK_SCHEDULES: 'workEpic:all',
    SYNC_FLAG: 'workEpic:needSync'
} as const

const DEFAULT_EXPIRE = 300 // 5 分鐘

class RedisClient {
    private static instance: RedisClient
    private client
    private connected = false

    private constructor() {
        this.client = createClient({ url: process.env.REDIS_URL })
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
        const client = await this.ensureConnection()
        return client.get(key)
    }

    async set(key: string, value: string, expirationSeconds: number) {
        const client = await this.ensureConnection()
        await client.setEx(key, expirationSeconds, value)
    }

    async getWorkSchedules(): Promise<WorkEpicEntity[]> {
        const client = await this.ensureConnection()
        const data = await client.get(CACHE_KEYS.WORK_SCHEDULES)
        return data ? JSON.parse(data) : []
    }

    async setWorkSchedules(schedules: WorkEpicEntity[]): Promise<void> {
        const client = await this.ensureConnection()
        await client.setEx(
            CACHE_KEYS.WORK_SCHEDULES,
            DEFAULT_EXPIRE,
            JSON.stringify(schedules)
        )
    }

    /**
     * 取得 Redis 用戶端實例
     * @returns Redis 用戶端
     */
    async getClient() {
        return await this.ensureConnection()
    }

    async updateWorkLoad(
        epicId: string,
        loadId: string,
        update: Partial<Pick<WorkLoadEntity, 'plannedStartTime' | 'plannedEndTime'>>
    ): Promise<boolean> {
        const schedules = await this.getWorkSchedules()
        const epicIndex = schedules.findIndex(e => e.epicId === epicId)
        if (epicIndex === -1) return false

        const workLoads = schedules[epicIndex].workLoads || []
        const loadIndex = workLoads.findIndex(l => l.loadId === loadId)
        if (loadIndex === -1) return false

        workLoads[loadIndex] = { ...workLoads[loadIndex], ...update }
        schedules[epicIndex].workLoads = workLoads

        await this.setWorkSchedules(schedules)
        // 設定需要同步的標記
        const client = await this.ensureConnection()
        await client.setEx(CACHE_KEYS.SYNC_FLAG, DEFAULT_EXPIRE, 'true')
        return true
    }
}

export const redisCache = RedisClient.getInstance()