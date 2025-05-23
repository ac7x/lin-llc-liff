import memcachedClient from '@/modules/shared/infrastructure/cache/memcached/client'
import { VisTimelineGroup, VisTimelineItem } from '../../domain/model/valueObject/visTimelineValueObject'
import { WorkScheduleRepository } from '../../domain/repository/WorkScheduleRepository'

/**
 * Memcached 快取實作
 */
export class WorkScheduleMemcachedRepository implements WorkScheduleRepository {
    private readonly itemKeyPrefix = 'workSchedule:item:'
    private readonly groupKey = 'workSchedule:groups'

    async getTimelineItems(): Promise<VisTimelineItem[]> {
        const keysRaw = await memcachedClient.get('workSchedule:itemKeys')
        if (!keysRaw.value) return []
        const ids: string[] = JSON.parse(keysRaw.value.toString())
        const items: VisTimelineItem[] = []
        for (const id of ids) {
            const raw = await memcachedClient.get(this.itemKeyPrefix + id)
            if (raw.value) items.push(JSON.parse(raw.value.toString()))
        }
        return items
    }

    async getTimelineGroups(): Promise<VisTimelineGroup[]> {
        const raw = await memcachedClient.get(this.groupKey)
        return raw.value ? JSON.parse(raw.value.toString()) : []
    }

    async setTimelineItem(item: VisTimelineItem): Promise<void> {
        await memcachedClient.set(this.itemKeyPrefix + item.id, Buffer.from(JSON.stringify(item)), { expires: 86400 })
        const keysRaw = await memcachedClient.get('workSchedule:itemKeys')
        let ids: string[] = keysRaw.value ? JSON.parse(keysRaw.value.toString()) : []
        if (!ids.includes(item.id)) {
            ids.push(item.id)
            await memcachedClient.set('workSchedule:itemKeys', Buffer.from(JSON.stringify(ids)), { expires: 86400 })
        }
    }

    async removeTimelineItem(itemId: string): Promise<void> {
        await memcachedClient.delete(this.itemKeyPrefix + itemId)
        const keysRaw = await memcachedClient.get('workSchedule:itemKeys')
        let ids: string[] = keysRaw.value ? JSON.parse(keysRaw.value.toString()) : []
        ids = ids.filter(id => id !== itemId)
        await memcachedClient.set('workSchedule:itemKeys', Buffer.from(JSON.stringify(ids)), { expires: 86400 })
    }
}
