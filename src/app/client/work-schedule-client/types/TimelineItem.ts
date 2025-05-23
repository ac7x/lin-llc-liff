/**
 * Timeline 項目的型別定義
 */

import { Moment } from 'moment';

export interface TimelineItem {
  /**
   * 項目唯一識別碼
   */
  id?: string | number;

  /**
   * 項目的開始日期/時間
   */
  start: Date | number | string | Moment;

  /**
   * 項目的結束日期/時間 (選擇性)
   * 如果有提供，項目會顯示為一個區間
   * 如果沒有提供，項目會顯示為一個點
   */
  end?: Date | number | string | Moment;

  /**
   * 項目的內容，可以是純文字或 HTML
   */
  content: string;

  /**
   * 項目所屬的群組 ID
   */
  group?: string | number;

  /**
   * 為項目指定 CSS 類別名稱
   */
  className?: string;

  /**
   * 項目是否可編輯，可覆寫全域設定
   */
  editable?: boolean | {
    /**
     * 是否可刪除
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
  };

  /**
   * 項目是否可選取
   */
  selectable?: boolean;

  /**
   * 項目的類型: 'box' (預設), 'point', 'range', 'background'
   */
  type?: 'box' | 'point' | 'range' | 'background';

  /**
   * 自訂 CSS 樣式字串
   */
  style?: string;

  /**
   * 次級群組 ID
   */
  subgroup?: string | number;

  /**
   * 滑鼠懸停時顯示的提示
   */
  title?: string;

  /**
   * 限制項目大小
   */
  limitSize?: boolean;

  /**
   * 對齊方式，覆蓋全域設定
   */
  align?: 'auto' | 'center' | 'left' | 'right';
}
