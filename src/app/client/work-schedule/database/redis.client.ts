import { createClient } from 'redis'

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
}

export const redisCache = RedisClient.getInstance()