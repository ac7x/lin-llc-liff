// TimelineOptions.ts

export interface TimelineOptionsParams {
  editable?: boolean | { add?: boolean; updateTime?: boolean; updateGroup?: boolean; remove?: boolean }
  stack?: boolean
  start?: Date
  end?: Date
  min?: Date
  max?: Date
  zoomable?: boolean
  moveable?: boolean
  selectable?: boolean
  multiselect?: boolean
  orientation?: 'top' | 'bottom' | 'both'
  // 可依需求繼續擴充 vis-timeline 的 options
}

export class TimelineOptions {
  readonly editable?: boolean | { add?: boolean; updateTime?: boolean; updateGroup?: boolean; remove?: boolean }
  readonly stack: boolean
  readonly start?: Date
  readonly end?: Date
  readonly min?: Date
  readonly max?: Date
  readonly zoomable: boolean
  readonly moveable: boolean
  readonly selectable: boolean
  readonly multiselect: boolean
  readonly orientation: 'top' | 'bottom' | 'both'

  constructor(params: TimelineOptionsParams = {}) {
    this.editable = params.editable
    this.stack = params.stack ?? true
    this.start = params.start
    this.end = params.end
    this.min = params.min
    this.max = params.max
    this.zoomable = params.zoomable ?? true
    this.moveable = params.moveable ?? true
    this.selectable = params.selectable ?? true
    this.multiselect = params.multiselect ?? false
    this.orientation = params.orientation ?? 'bottom'
  }

  // 你可以加入驗證或轉換方法
}
