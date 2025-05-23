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
        try {
            // 確保連線
            const client = await this.ensureConnection()
            if (!client) throw new Error('無法連接到 Redis')

            // 取得排程資料
            const schedules = await this.getWorkSchedules()

            // 尋找對應的 epic
            const epicIndex = schedules.findIndex(e => e.epicId === epicId)
            if (epicIndex === -1) {
                console.warn(`找不到 Epic: ${epicId}`)
                return false
            }

            // 尋找對應的工作負載
            const workLoads = schedules[epicIndex].workLoads || []
            const loadIndex = workLoads.findIndex(l => l.loadId === loadId)
            if (loadIndex === -1) {
                console.warn(`找不到工作負載: ${loadId}`)
                return false
            }

            // 更新工作負載 - 使用深拷貝確保不會有引用問題
            const updatedWorkLoad = JSON.parse(JSON.stringify({ ...workLoads[loadIndex], ...update }))
            const updatedWorkLoads = [...workLoads]
            updatedWorkLoads[loadIndex] = updatedWorkLoad

            // 創建新的 schedules 陣列和 epic 物件，避免直接修改原始參考
            const updatedSchedules = [...schedules]
            updatedSchedules[epicIndex] = {
                ...schedules[epicIndex],
                workLoads: updatedWorkLoads
            }

            // 寫入 Redis - 使用更新後的 updatedSchedules
            await this.setWorkSchedules(updatedSchedules)

            // 設定需要同步的標記
            await client.setEx(CACHE_KEYS.SYNC_FLAG, DEFAULT_EXPIRE, 'true')

            // 記錄成功更新的資訊就當ㄧㄡ處
            console.log(`成功更新工作負載 ID: ${loadId} (Redis)`)

            return true
        } catch (error) {
            console.error('Redis updateWorkLoad 失敗:', error)
            throw error // 重新拋出以便上層進行重試或降級處理
        }
    }
}

export const redisCache = RedisClient.getInstance()