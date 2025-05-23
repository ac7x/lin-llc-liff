/**
 * Timeline 常數定義
 */

/**
 * 項目類型
 */
export enum TimelineItemType {
  BOX = 'box',
  POINT = 'point',
  RANGE = 'range',
  BACKGROUND = 'background'
}

/**
 * 項目對齊方式
 */
export enum TimelineItemAlign {
  AUTO = 'auto',
  CENTER = 'center',
  LEFT = 'left',
  RIGHT = 'right'
}

/**
 * 時間尺度
 */
export enum TimelineScale {
  MILLISECOND = 'millisecond',
  SECOND = 'second',
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEKDAY = 'weekday',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

/**
 * 群組高度模式
 */
export enum GroupHeightMode {
  AUTO = 'auto',
  FIXED = 'fixed',
  FIT_ITEMS = 'fitItems'
}

/**
 * 隱藏日期的重複模式
 */
export enum HiddenDateRepeat {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

/**
 * 縮放按鍵
 */
export enum ZoomKey {
  CTRL = 'ctrlKey',
  ALT = 'altKey',
  META = 'metaKey',
  NONE = ''
}

/**
 * 預設項目選項
 */
export const DEFAULT_ITEM_OPTIONS = {
  selectable: true,
  type: TimelineItemType.BOX,
  align: TimelineItemAlign.AUTO
};

/**
 * 預設群組選項
 */
export const DEFAULT_GROUP_OPTIONS = {
  visible: true,
  showNested: true
};

/**
 * 預設編輯選項
 */
export const DEFAULT_EDITABLE_OPTIONS = {
  add: false,
  remove: false,
  updateTime: false,
  updateGroup: false,
  overrideItems: false
};

/**
 * 預設群組編輯選項
 */
export const DEFAULT_GROUP_EDITABLE_OPTIONS = {
  add: false,
  remove: false,
  order: false
};

/**
 * 預設時間軸選項
 */
export const DEFAULT_TIMELINE_OPTIONS = {
  width: '100%',
  height: '400px',
  align: TimelineItemAlign.CENTER,
  autoResize: true,
  clickToUse: false,
  editable: false,
  selectable: true,
  multiselect: false,
  multiselectPerGroup: false,
  stack: true,
  showCurrentTime: true,
  showMajorLabels: true,
  showMinorLabels: true,
  moveable: true,
  zoomable: true,
  zoomKey: ZoomKey.NONE,
  groupHeightMode: GroupHeightMode.AUTO
};
