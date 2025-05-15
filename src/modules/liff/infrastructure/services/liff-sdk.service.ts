// filepath: /workspaces/next-liff-template/src/modules/liff/infrastructure/services/liff-sdk.service.ts
import { LiffContextDto, LiffFriendshipDto, LiffLoginResultDto, LiffShareResultDto, LiffUserDto } from "../../application/dtos/liff-user.dto";
import { LiffIdValueObject } from "../../domain/valueObjects/liff-id.value-object";
import { LineContext, LineProfile, LiffSDK, LiffSdkServiceInterface } from "./liff-sdk.interface";

/**
 * LIFF SDK 服務實作
 * 實現與 LIFF SDK 的互動邏輯
 */
export class LiffSdkService implements LiffSdkServiceInterface {
  private liffSDK: LiffSDK | null = null;
  private isInitialized: boolean = false;
  
  // 實現單例模式，確保只有一個 LIFF SDK 實例
  private static instance: LiffSdkService | null = null;
  
  public static getInstance(): LiffSdkService {
    if (!LiffSdkService.instance) {
      LiffSdkService.instance = new LiffSdkService();
    }
    return LiffSdkService.instance;
  }
  
  private constructor() {}
  
  /**
   * 初始化 LIFF SDK
   */
  async initialize(liffId?: string): Promise<boolean> {
    if (this.isInitialized && this.liffSDK) {
      return true;
    }
    
    try {
      // 使用硬編碼的 LIFF ID 或提供的 ID
      const targetLiffId = liffId || LiffIdValueObject.getDefaultLiffId().value;
      
      // 動態引入 LIFF SDK (避免 SSR 問題)
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      
      // 初始化 LIFF
      await liff.init({
        liffId: targetLiffId,
        withLoginOnExternalBrowser: true
      });
      
      // 使用類型轉換將 LIFF SDK 賦值給我們的介面變數
      this.liffSDK = liff as unknown as LiffSDK;
      this.isInitialized = true;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize LIFF SDK:', error);
      return false;
    }
  }
  
  /**
   * 檢查用戶是否已登入
   */
  isLoggedIn(): boolean {
    if (!this.liffSDK) return false;
    return this.liffSDK.isLoggedIn();
  }
  
  /**
   * 執行登入流程
   */
  async login(): Promise<LiffLoginResultDto> {
    if (!this.liffSDK) {
      throw new Error('LIFF SDK not initialized');
    }
    
    this.liffSDK.login();
    
    // 由於 LINE 登入會重新導向，這裡回傳預設值
    return {
      isLoggedIn: true,
      userId: undefined,
      displayName: undefined
    };
  }
  
  /**
   * 執行登出流程
   */
  logout(): void {
    if (!this.liffSDK) {
      throw new Error('LIFF SDK not initialized');
    }
    
    this.liffSDK.logout();
  }
  
  /**
   * 取得用戶個人資料
   */
  async getProfile(): Promise<LiffUserDto> {
    if (!this.liffSDK) {
      throw new Error('LIFF SDK not initialized');
    }
    
    if (!this.isLoggedIn()) {
      throw new Error('User not logged in');
    }
    
    try {
      // 從 LIFF SDK 獲取基本個人資料
      const profile = await this.liffSDK.getProfile();
      
      // 轉換為應用層 DTO，添加所需屬性
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
        isLoggedIn: true
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }
  
  /**
   * 取得 LIFF 環境上下文
   */
  getContext(): LiffContextDto | null {
    if (!this.liffSDK) return null;
    const context = this.liffSDK.getContext();
    
    if (!context) return null;
    
    // 轉換為應用層 DTO，添加所需屬性
    return {
      liffId: context.liffId,
      type: context.type,
      viewType: context.viewType,
      userId: context.userId,
      isInClient: this.liffSDK.isInClient()
    };
  }
  
  /**
   * 取得裝置作業系統
   */
  getOS(): string | null {
    if (!this.liffSDK) return null;
    return this.liffSDK.getOS() || null;
  }
  
  /**
   * 檢查是否在 LIFF 瀏覽器內
   */
  isInClient(): boolean {
    if (!this.liffSDK) return false;
    return this.liffSDK.isInClient();
  }
  
  /**
   * 開啟外部窗口
   */
  openWindow(url: string, external: boolean): void {
    if (!this.liffSDK) {
      throw new Error('LIFF SDK not initialized');
    }
    
    this.liffSDK.openWindow({ url, external });
  }
  
  /**
   * 關閉 LIFF 窗口
   */
  closeWindow(): void {
    if (!this.liffSDK) {
      throw new Error('LIFF SDK not initialized');
    }
    
    this.liffSDK.closeWindow();
  }
  
  /**
   * 取得 LINE 語系
   */
  getLanguage(): string | null {
    if (!this.liffSDK) return null;
    return this.liffSDK.getLanguage() || null;
  }
  
  /**
   * 取得 LIFF 版本
   */
  getLiffVersion(): string | null {
    if (!this.liffSDK) return null;
    return this.liffSDK.getVersion() || null;
  }
  
  /**
   * 取得 LINE 版本
   */
  getLineVersion(): string | null {
    if (!this.liffSDK) return null;
    return this.liffSDK.getLineVersion() || null;
  }
  
  /**
   * 取得好友關係狀態
   */
  async getFriendship(): Promise<LiffFriendshipDto> {
    if (!this.liffSDK) {
      throw new Error('LIFF SDK not initialized');
    }
    
    try {
      const friendship = await this.liffSDK.getFriendship();
      return {
        friendFlag: friendship.friendFlag
      };
    } catch (error) {
      console.error('Failed to get friendship status:', error);
      return { friendFlag: false };
    }
  }
  
  /**
   * 打開分享對話框
   */
  async shareTargetPicker(text: string): Promise<LiffShareResultDto> {
    if (!this.liffSDK) {
      throw new Error('LIFF SDK not initialized');
    }
    
    try {
      const result = await this.liffSDK.shareTargetPicker([
        {
          type: 'text',
          text: text
        } as any  // 使用類型斷言處理 LINE SDK 的消息格式
      ]);
      
      if (result) {
        return {
          status: result.status,
          success: true
        };
      } else {
        return {
          status: 'canceled',
          success: false
        };
      }
    } catch (error) {
      console.error('Share target picker error:', error);
      throw error;
    }
  }
  
  /**
   * 掃描 QR 碼
   */
  async scanQrCode(): Promise<{ value: string } | null> {
    if (!this.liffSDK) {
      throw new Error('LIFF SDK not initialized');
    }
    
    try {
      return await this.liffSDK.scanCodeV2();
    } catch (error) {
      console.error('Scan QR code error:', error);
      return null;
    }
  }
}
