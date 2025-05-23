/**
 * Timeline 選項設定的型別定義
 */

import { TimelineItem } from './TimelineItem';
import { TimelineGroup } from './TimelineGroup';
import { Moment } from 'moment';

export interface TimelineOptions {
  /**
   * 對齊方式
   */
  align?: 'auto' | 'center' | 'left' | 'right';

  /**
   * 是否自動調整大小
   */
  autoResize?: boolean;

  /**
   * 是否僅在點擊時啟用
   */
  clickToUse?: boolean;

  /**
   * 顯示配置選項
   */
  configure?: boolean | ((option: any, path: any[]) => boolean);

  /**
   * 資料屬性，用於 DOM 元素
   */
  dataAttributes?: string[] | 'all';

  /**
   * 可編輯設定
   */
  editable?: boolean | {
    /**
     * 是否可新增項目
     */
    add?: boolean;
    
    /**
     * 是否可刪除項目
     */
    remove?: boolean;
    
    /**
     * 是否可更新群組
     */
    updateGroup?: boolean;
    
    /**
     * 是否可更新時間
     */
    updateTime?: boolean;
    
    /**
     * 是否覆蓋項目的編輯設定
     */
    overrideItems?: boolean;
  };

  /**
   * 時間軸結束日期
   */
  end?: Date | number | string | Moment;

  /**
   * 日期格式化設定
   */
  format?: {
    /**
     * 次要標籤格式
     */
    minorLabels?: {
      millisecond?: string;
      second?: string;
      minute?: string;
      hour?: string;
      weekday?: string;
      day?: string;
      week?: string;
      month?: string;
      year?: string;
    };
    
    /**
     * 主要標籤格式
     */
    majorLabels?: {
      millisecond?: string;
      second?: string;
      minute?: string;
      hour?: string;
      weekday?: string;
      day?: string;
      month?: string;
      year?: string;
    };
  } | {
    /**
     * 次要標籤自訂函式
     */
    minorLabels?: (date: Date, scale: number, step: number) => string;
    
    /**
     * 主要標籤自訂函式
     */
    majorLabels?: (date: Date, scale: number, step: number) => string;
  };

  /**
   * 群組可編輯設定
   */
  groupEditable?: boolean | {
    /**
     * 是否可新增群組
     */
    add?: boolean;
    
    /**
     * 是否可刪除群組
     */
    remove?: boolean;
    
    /**
     * 是否可排序群組
     */
    order?: boolean;
  };

  /**
   * 群組高度模式
   */
  groupHeightMode?: 'auto' | 'fixed' | 'fitItems';

  /**
   * 群組排序
   */
  groupOrder?: string | ((a: any, b: any) => number);

  /**
   * 群組排序交換函式
   */
  groupOrderSwap?: (fromGroup: any, toGroup: any, groups: any) => void;

  /**
   * 群組模板
   */
  groupTemplate?: (group: TimelineGroup, element: HTMLElement) => string | HTMLElement;

  /**
   * 時間軸高度
   */
  height?: number | string;

  /**
   * 隱藏的日期範圍
   */
  hiddenDates?: Array<{
    start: string;
    end: string;
    repeat?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }>;

  /**
   * 是否啟用水平捲動
   */
  horizontalScroll?: boolean;

  /**
   * 項目永遠可拖曳設定
   */
  itemsAlwaysDraggable?: boolean | {
    /**
     * 項目是否永遠可拖曳
     */
    item?: boolean;
    
    /**
     * 範圍是否永遠可拖曳
     */
    range?: boolean;
  };

  /**
   * 本地化設定
   */
  locale?: string;

  /**
   * 自訂本地化設定
   */
  locales?: {
    [locale: string]: {
      current: string;
      time: string;
      deleteSelected: string;
      [key: string]: string;
    };
  };

  /**
   * 長按選取時間
   */
  longSelectPressTime?: number;

  /**
   * 處理日期的 moment 函式
   */
  moment?: (date: Date) => Moment;

  /**
   * 邊距設定
   */
  margin?: number | {
    /**
     * 軸的邊距
     */
    axis?: number;
    
    /**
     * 項目的邊距
     */
    item?: number;
    
    /**
     * 項目的水平邊距
     */
    itemHorizontal?: number;
    
    /**
     * 項目的垂直邊距
     */
    itemVertical?: number;
  };

  /**
   * 時間軸最大日期
   */
  max?: Date | number | string | Moment;

  /**
   * 時間軸最大高度
   */
  maxHeight?: number | string;

  /**
   * 次要網格標籤最大字元數
   */
  maxMinorChars?: number;

  /**
   * 時間軸最小日期
   */
  min?: Date | number | string | Moment;

  /**
   * 時間軸最小高度
   */
  minHeight?: number | string;

  /**
   * 是否可移動
   */
  moveable?: boolean;

  /**
   * 是否可多選
   */
  multiselect?: boolean;

  /**
   * 是否只能在同一群組內多選
   */
  multiselectPerGroup?: boolean;

  /**
   * 新增項目回調函式
   */
  onAdd?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;

  /**
   * 新增群組回調函式
   */
  onAddGroup?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;

  /**
   * 拖放物件到項目上的回調函式
   */
  onDropObjectOnItem?: (objectData: any, item: TimelineItem) => void;

  /**
   * 初始繪製完成回調
   */
  onInitialDrawComplete?: () => void;

  /**
   * 移動項目回調
   */
  onMove?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;

  /**
   * 移動群組回調
   */
  onMoveGroup?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;

  /**
   * 移動中回調
   */
  onMoving?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;

  /**
   * 刪除項目回調
   */
  onRemove?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;

  /**
   * 刪除群組回調
   */
  onRemoveGroup?: (group: TimelineGroup, callback: (group: TimelineGroup | null) => void) => void;

  /**
   * 更新項目回調
   */
  onUpdate?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;

  /**
   * 項目排序
   */
  order?: ((a: TimelineItem, b: TimelineItem) => number) | null;

  /**
   * 兩次添加之間的間隔時間
   */
  rollingMode?: {
    follow: boolean;
    offset?: number;
  };

  /**
   * 是否顯示當前時間
   */
  showCurrentTime?: boolean;

  /**
   * 是否顯示主要標籤
   */
  showMajorLabels?: boolean;

  /**
   * 是否顯示次要標籤
   */
  showMinorLabels?: boolean;

  /**
   * 是否顯示工具提示
   */
  showTooltips?: boolean;

  /**
   * 堆疊項目
   */
  stack?: boolean;

  /**
   * 項目樣式
   */
  stackSubgroups?: boolean;

  /**
   * 開始日期
   */
  start?: Date | number | string | Moment;

  /**
   * 分配至子群組
   */
  subgroupStack?: {
    [subgroupId: string]: boolean;
  };

  /**
   * 項目模板
   */
  template?: (item: TimelineItem, element: HTMLElement, data?: any) => string | HTMLElement;

  /**
   * 時間軸
   */
  timeAxis?: {
    scale?: string;
    step?: number;
  };

  /**
   * 時間軸寬度
   */
  width?: string | number;

  /**
   * 是否可縮放
   */
  zoomable?: boolean;

  /**
   * 縮放因子
   */
  zoomFriction?: number;

  /**
   * 縮放按鍵
   */
  zoomKey?: 'ctrlKey' | 'altKey' | 'metaKey' | '';

  /**
   * 最大縮放
   */
  zoomMax?: number;

  /**
   * 最小縮放
   */
  zoomMin?: number;
}
