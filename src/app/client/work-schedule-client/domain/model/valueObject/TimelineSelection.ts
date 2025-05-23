// TimelineSelection.ts

export interface TimelineSelectionParams {
  selectedIds: (string | number)[]
  multiple: boolean
}

export class TimelineSelection {
  readonly selectedIds: (string | number)[]
  readonly multiple: boolean

  constructor(params: TimelineSelectionParams) {
    this.selectedIds = params.selectedIds
    this.multiple = params.multiple
  }

  isSelected(id: string | number): boolean {
    return this.selectedIds.includes(id)
  }
}
