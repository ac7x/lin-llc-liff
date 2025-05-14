'use client';

import { initializeLiffAction, loginAction, logoutAction } from '../../application/actions/initialize-liff.action';
import { LiffProfileDto } from '../../infrastructure/dtos/liff-profile.dto';
import { LiffSdkService } from '../../infrastructure/services/liff-sdk.service';

/**
 * 初始化客戶端 LIFF SDK
 * 實現在客戶端初始化 LIFF 並處理登入邏輯
 */
class LiffInitializer {
  private liffSdkService: LiffSdkService | null = null;
  private isInitialized: boolean = false;

  /**
   * 初始化 LIFF SDK
   */
  async initialize(liffId: string): Promise<boolean> {
    try {
      // 首先從伺服端初始化
      const result = await initializeLiffAction(liffId);
      
      if (!result.success) {
        console.error('Server-side LIFF initialization failed:', result.error);
        return false;
      }

      // 在客戶端初始化 LIFF SDK
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      
      await liff.init({ liffId, withLoginOnExternalBrowser: true });
      
      // 設置 LIFF SDK Service
      this.liffSdkService = new LiffSdkService();
      this.liffSdkService.setLiffInstance(liff);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing LIFF:', error);
      return false;
    }
  }

  /**
   * 獲取用戶資料
   */
  async getProfile(): Promise<LiffProfileDto | null> {
    if (!this.isInitialized || !this.liffSdkService) {
      console.error('LIFF is not initialized');
      return null;
    }
    
    try {
      if (!this.liffSdkService.isLoggedIn()) {
        return null;
      }
      
      return await this.liffSdkService.getProfile();
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * 是否已初始化
   */
  isInitializedStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * 是否已登入
   */
  isLoggedIn(): boolean {
    if (!this.isInitialized || !this.liffSdkService) {
      return false;
    }
    
    return this.liffSdkService.isLoggedIn();
  }

  /**
   * 登入
   */
  async login(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.liffSdkService) {
        console.error('LIFF is not initialized');
        return false;
      }

      // 如果客戶端已登入，則直接獲取資料
      if (this.liffSdkService.isLoggedIn()) {
        return true;
      }

      // 進行登入
      await this.liffSdkService.login();
      
      // 通知服務器
      const result = await loginAction();
      return result.success;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.liffSdkService) {
        console.error('LIFF is not initialized');
        return false;
      }

      // 進行登出
      this.liffSdkService.logout();
      
      // 通知服務器
      const result = await logoutAction();
      return result.success;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  /**
   * 獲取 LIFF SDK 服務實例
   */
  getLiffSdkService(): LiffSdkService | null {
    return this.liffSdkService;
  }
}

// 單例實例
const liffInitializer = new LiffInitializer();

export default liffInitializer;
