// TimelineDataSet.ts

import { TimelineItem } from './TimelineItem'
import { TimelineGroup } from './TimelineGroup'

export class TimelineDataSet<T> {
  private items: Map<string | number, T> = new Map()

  constructor(initialItems?: T[]) {
    if (initialItems) {
      initialItems.forEach(item => {
        // @ts-ignore assume item has id prop
        this.items.set(item.id, item)
      })
    }
  }

  add(item: T & { id: string | number }): void {
    this.items.set(item.id, item)
  }

  update(id: string | number, update: Partial<T>): void {
    const existing = this.items.get(id)
    if (!existing) return
    const updated = { ...existing, ...update }
    this.items.set(id, updated as T)
  }

  remove(id: string | number): void {
    this.items.delete(id)
  }

  get(id: string | number): T | undefined {
    return this.items.get(id)
  }

  getAll(): T[] {
    return Array.from(this.items.values())
  }

  clear(): void {
    this.items.clear()
  }
}
