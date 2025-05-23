/**
 * Timeline 群組的型別定義
 */

export interface TimelineGroup {
  /**
   * 群組唯一識別碼
   */
  id: string | number;

  /**
   * 群組內容，可以是純文字、HTML 或 DOM 元素
   */
  content: string | HTMLElement;

  /**
   * 為群組指定 CSS 類別名稱
   */
  className?: string;

  /**
   * 自訂 CSS 樣式字串
   */
  style?: string;

  /**
   * 次群組排序方式
   */
  subgroupOrder?: string | ((a: any, b: any) => number);

  /**
   * 次群組堆疊設定
   */
  subgroupStack?: { [subgroupId: string]: boolean } | boolean;

  /**
   * 次群組可見性設定
   */
  subgroupVisibility?: { [subgroupId: string]: boolean };

  /**
   * 滑鼠懸停時顯示的提示
   */
  title?: string;

  /**
   * 群組是否可見
   */
  visible?: boolean;

  /**
   * 巢狀群組的 ID 陣列
   */
  nestedGroups?: Array<string | number>;

  /**
   * 是否顯示巢狀群組
   */
  showNested?: boolean;
}
