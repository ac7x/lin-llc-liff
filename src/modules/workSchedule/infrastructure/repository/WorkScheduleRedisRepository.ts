import { redisCache } from '@/modules/shared/infrastructure/cache/redis/client'
import { createClient } from 'redis'
import { VisTimelineGroup, VisTimelineItem } from '../../domain/model/valueObject/visTimelineValueObject'
import { WorkScheduleRepository } from '../../domain/repository/WorkScheduleRepository'

/**
 * Redis 快取實作
 */
export class WorkScheduleRedisRepository implements WorkScheduleRepository {
    private readonly itemKeyPrefix = 'workSchedule:item:'
    private readonly groupKey = 'workSchedule:groups'

    async getTimelineItems(): Promise<VisTimelineItem[]> {
        const keys = await redisCache.get('workSchedule:itemKeys')
        if (!keys) return []
        const ids: string[] = JSON.parse(keys)
        const items: VisTimelineItem[] = []
        for (const id of ids) {
            const raw = await redisCache.get(this.itemKeyPrefix + id)
            if (raw) items.push(JSON.parse(raw))
        }
        return items
    }

    async getTimelineGroups(): Promise<VisTimelineGroup[]> {
        const raw = await redisCache.get(this.groupKey)
        return raw ? JSON.parse(raw) : []
    }

    async setTimelineItem(item: VisTimelineItem): Promise<void> {
        await redisCache.set(this.itemKeyPrefix + item.id, JSON.stringify(item), 86400)
        let keys = await redisCache.get('workSchedule:itemKeys')
        let ids: string[] = keys ? JSON.parse(keys) : []
        if (!ids.includes(item.id)) {
            ids.push(item.id)
            await redisCache.set('workSchedule:itemKeys', JSON.stringify(ids), 86400)
        }
    }

    async removeTimelineItem(itemId: string): Promise<void> {
        // 直接使用 client.del
        const client = createClient({ url: process.env.REDIS_URL })
        if (!client.isOpen) await client.connect()
        await client.del(this.itemKeyPrefix + itemId)
        let keys = await redisCache.get('workSchedule:itemKeys')
        let ids: string[] = keys ? JSON.parse(keys) : []
        ids = ids.filter(id => id !== itemId)
        await redisCache.set('workSchedule:itemKeys', JSON.stringify(ids), 86400)
    }
}
