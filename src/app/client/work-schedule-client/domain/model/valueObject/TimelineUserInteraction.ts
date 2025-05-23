// TimelineUserInteraction.ts

import { TimelineEvent } from './TimelineEvent'

export type UserInteractionType = 
  | 'click' 
  | 'doubleClick' 
  | 'select' 
  | 'itemover' 
  | 'itemout' 
  | 'rangechange' 
  | 'rangechanged' 
  | 'timechange' 
  | 'timechanged' 
  | 'contextmenu' 
  | 'drop' 
  | 'dragStart' 
  | 'dragging' 
  | 'dragEnd'

export class TimelineUserInteraction {
  readonly type: UserInteractionType
  readonly payload: any

  constructor(type: UserInteractionType, payload: any) {
    this.type = type
    this.payload = payload
  }

  isDragEvent(): boolean {
    return ['dragStart', 'dragging', 'dragEnd'].includes(this.type)
  }

  isSelectionEvent(): boolean {
    return this.type === 'select'
  }

  // 其他常用行為封裝
}
