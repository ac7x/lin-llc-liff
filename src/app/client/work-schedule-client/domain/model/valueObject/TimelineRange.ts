// TimelineRange.ts

export class TimelineRange {
  readonly start: Date
  readonly end: Date

  constructor(start: Date, end: Date) {
    if (end < start) {
      throw new Error('TimelineRange: end date must be equal or later than start date')
    }
    this.start = start
    this.end = end
  }

  durationMs(): number {
    return this.end.getTime() - this.start.getTime()
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end
  }

  overlaps(other: TimelineRange): boolean {
    return this.start <= other.end && other.start <= this.end
  }
}
