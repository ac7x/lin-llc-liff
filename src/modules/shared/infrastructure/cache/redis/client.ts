import { createClient, RedisClientType } from 'redis';

class RedisClientSingleton {
    private static client: RedisClientType;
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

        if (!RedisClientSingleton.connected) {
            await RedisClientSingleton.client.connect();
            RedisClientSingleton.connected = true;
        }
    }

    public static async getClient(): Promise<RedisClientType> {
        await this.initialize();
        return RedisClientSingleton.client;
    }
}

export const redisCache = {
    async get(key: string): Promise<string | null> {
        const client = await RedisClientSingleton.getClient();
        return client.get(key);
    },

    async set(key: string, value: string, expirationSeconds: number): Promise<void> {
        const client = await RedisClientSingleton.getClient();
        await client.setEx(key, expirationSeconds, value);
    },
};
