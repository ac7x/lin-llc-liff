import { createClient, RedisClientType } from 'redis';

// 單例封裝（不 export，僅內部使用）
class RedisClientSingleton {
    private static client: RedisClientType | undefined;
    private static connected = false;

    private static async initialize() {
        if (!RedisClientSingleton.client) {
            RedisClientSingleton.client = createClient({
                url: process.env.REDIS_URL,
            });

            RedisClientSingleton.client.on('error', (err) => {
                console.error('Redis connection error:', err);
            });
        }

        if (!RedisClientSingleton.connected && RedisClientSingleton.client) {
            await RedisClientSingleton.client.connect();
            RedisClientSingleton.connected = true;
        }
    }

    public static async getClient(): Promise<RedisClientType> {
        await this.initialize();
        if (!RedisClientSingleton.client) {
            throw new Error("Redis Client not initialized");
        }
        return RedisClientSingleton.client;
    }
}

// 封裝常用方法，只 export redisCache
export const redisCache = {
    async get(key: string): Promise<string | null> {
        const client = await RedisClientSingleton.getClient();
        return client.get(key);
    },

    async set(key: string, value: string, expirationSeconds: number): Promise<void> {
        const client = await RedisClientSingleton.getClient();
        await client.setEx(key, expirationSeconds, value);
    },

    async del(key: string): Promise<void> {
        const client = await RedisClientSingleton.getClient();
        await client.del(key);
    },

    async exists(key: string): Promise<boolean> {
        const client = await RedisClientSingleton.getClient();
        const result = await client.exists(key);
        return result === 1;
    },

    async hset(key: string, data: Record<string, string | number | boolean>): Promise<void> {
        const client = await RedisClientSingleton.getClient();
        // 全部轉成 string，否則型別錯誤
        const stringData: Record<string, string> = {};
        for (const k in data) {
            stringData[k] = String(data[k]);
        }
        await client.hSet(key, stringData);
    },

    async hgetall(key: string): Promise<Record<string, string>> {
        const client = await RedisClientSingleton.getClient();
        return await client.hGetAll(key);
    },

    async flushAll(): Promise<void> {
        const client = await RedisClientSingleton.getClient();
        await client.flushAll();
    }
};