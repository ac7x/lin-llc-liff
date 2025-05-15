import { LiffContextDto, LiffFriendshipDto, LiffUserDto } from "../dtos/liff-user.dto";

/**
 * LIFF 查詢服務介面
 * 處理與 LIFF 相關的查詢操作
 */
export interface LiffQueryServiceInterface {
  /**
   * 取得 LIFF 用戶資訊
   */
  getUserProfile(): Promise<LiffUserDto | null>;
  
  /**
   * 確認用戶是否已登入
   */
  isLoggedIn(): boolean;
  
  /**
   * 取得 LIFF 環境上下文
   */
  getContext(): LiffContextDto | null;
  
  /**
   * 取得裝置作業系統
   */
  getOS(): string | null;
  
  /**
   * 取得 LINE 語系
   */
  getLanguage(): string | null;
  
  /**
   * 檢查是否在 LIFF 瀏覽器內
   */
  isInClient(): boolean;
  
  /**
   * 取得 LIFF 版本
   */
  getLiffVersion(): string | null;
  
  /**
   * 取得 LINE 版本
   */
  getLineVersion(): string | null;
  
  /**
   * 取得好友關係狀態
   */
  getFriendship(): Promise<LiffFriendshipDto | null>;
}
