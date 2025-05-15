/**
 * LIFF 領域服務介面
 * 處理無法自然歸屬於單一實體的領域邏輯
 */
export interface LiffDomainService {
  /**
   * 驗證用戶是否為好友關係
   */
  verifyFriendship(userId: string): Promise<boolean>;
  
  /**
   * 產生分享連結
   */
  generateShareableLink(liffId: string, params?: Record<string, string>): string;
}
