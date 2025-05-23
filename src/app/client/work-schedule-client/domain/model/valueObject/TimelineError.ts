// TimelineError.ts

export class TimelineError extends Error {
  readonly code: string

  constructor(message: string, code = 'TIMELINE_ERROR') {
    super(message)
    this.name = 'TimelineError'
    this.code = code
  }

  static invalidDateRange() {
    return new TimelineError('Invalid date range: end must be after start', 'INVALID_DATE_RANGE')
  }

  static itemNotFound(id: string | number) {
    return new TimelineError(`Item not found with id: ${id}`, 'ITEM_NOT_FOUND')
  }
}
