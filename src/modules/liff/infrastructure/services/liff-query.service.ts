import { LiffContextDto, LiffFriendshipDto, LiffUserDto } from "../dtos/liff-user.dto";
import { LiffQueryServiceInterface } from "../queries/liff-query.service.interface";
import { LiffSdkServiceInterface } from "../../infrastructure/services/liff-sdk.interface";

/**
 * LIFF 查詢服務實現
 * 處理與 LIFF 相關的查詢操作
 */
export class LiffQueryService implements LiffQueryServiceInterface {
  constructor(private readonly liffSdkService: LiffSdkServiceInterface) {}
  
  /**
   * 取得 LIFF 用戶資訊
   */
  async getUserProfile(): Promise<LiffUserDto | null> {
    if (!this.isLoggedIn()) {
      return null;
    }
    
    try {
      return await this.liffSdkService.getProfile();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }
  
  /**
   * 確認用戶是否已登入
   */
  isLoggedIn(): boolean {
    return this.liffSdkService.isLoggedIn();
  }
  
  /**
   * 取得 LIFF 環境上下文
   */
  getContext(): LiffContextDto | null {
    return this.liffSdkService.getContext();
  }
  
  /**
   * 取得裝置作業系統
   */
  getOS(): string | null {
    return this.liffSdkService.getOS();
  }
  
  /**
   * 取得 LINE 語系
   */
  getLanguage(): string | null {
    return this.liffSdkService.getLanguage();
  }
  
  /**
   * 檢查是否在 LIFF 瀏覽器內
   */
  isInClient(): boolean {
    return this.liffSdkService.isInClient();
  }
  
  /**
   * 取得 LIFF 版本
   */
  getLiffVersion(): string | null {
    return this.liffSdkService.getLiffVersion();
  }
  
  /**
   * 取得 LINE 版本
   */
  getLineVersion(): string | null {
    return this.liffSdkService.getLineVersion();
  }
  
  /**
   * 取得好友關係狀態
   */
  async getFriendship(): Promise<LiffFriendshipDto | null> {
    try {
      return await this.liffSdkService.getFriendship();
    } catch (error) {
      console.error('Failed to get friendship status:', error);
      return null;
    }
  }
}
