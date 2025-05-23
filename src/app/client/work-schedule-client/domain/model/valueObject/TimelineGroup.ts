// src/modules/workSchedule/domain/model/valueObject/TimelineGroup.ts

export interface TimelineGroupParams {
  id: string | number
  content: string
  className?: string
  nestedGroups?: (string | number)[]
  showNested?: boolean
  order?: number
  title?: string
}

export class TimelineGroup {
  readonly id: string | number
  readonly content: string
  readonly className?: string
  readonly nestedGroups?: (string | number)[]
  readonly showNested?: boolean
  readonly order?: number
  readonly title?: string

  constructor(params: TimelineGroupParams) {
    this.id = params.id
    this.content = params.content
    this.className = params.className
    this.nestedGroups = params.nestedGroups
    this.showNested = params.showNested
    this.order = params.order
    this.title = params.title
  }
}
