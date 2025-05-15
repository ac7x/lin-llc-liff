import { LiffCommandServiceInterface } from "@/modules/liff/application/commands/liff-command.service.interface";
import { LiffLoginResultDto, LiffShareResultDto } from "@/modules/liff/application/dtos/liff-user.dto";
import { LiffIdValueObject } from "../../domain/valueObjects/liff-id.value-object";
import { LiffSdkServiceInterface } from "../../infrastructure/services/liff-sdk.interface";

/**
 * LIFF 命令服務實現
 * 處理與 LIFF 相關的修改操作
 */
export class LiffCommandService implements LiffCommandServiceInterface {
  constructor(private readonly liffSdkService: LiffSdkServiceInterface) { }

  /**
   * 初始化 LIFF SDK
   */
  async initialize(liffId?: string): Promise<boolean> {
    // 使用參數提供的 LIFF ID 或預設值
    const targetLiffId = liffId || LiffIdValueObject.getDefaultLiffId().value;

    try {
      return await this.liffSdkService.initialize(targetLiffId);
    } catch (error) {
      console.error('Failed to initialize LIFF:', error);
      return false;
    }
  }

  /**
   * 確認 LIFF SDK 是否已初始化
   */
  isInitialized(): boolean {
    return this.liffSdkService.isInitialized;
  }

  /**
   * 登入 LIFF
   */
  async login(): Promise<LiffLoginResultDto> {
    // 確保 LIFF SDK 已初始化
    if (!this.liffSdkService.isInitialized) {
      await this.liffSdkService.initialize();
    }
    try {
      const result = await this.liffSdkService.login();
      // 登入後獲取用戶資料
      if (result.isLoggedIn) {
        try {
          const profile = await this.liffSdkService.getProfile();
          return {
            isLoggedIn: true,
            userId: profile.userId,
            displayName: profile.displayName
          };
        } catch (profileError) {
          console.error('Failed to get user profile after login:', profileError);
          return result;
        }
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * 登出 LIFF
   */
  async logout(): Promise<void> {
    // 確保 LIFF SDK 已初始化
    if (!this.liffSdkService.isInitialized) {
      await this.liffSdkService.initialize();
    }
    try {
      this.liffSdkService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * 開啟外部窗口
   */
  openWindow(url: string, external: boolean): void {
    try {
      this.liffSdkService.openWindow(url, external);
    } catch (error) {
      console.error('Open window error:', error);
      throw error;
    }
  }

  /**
   * 關閉 LIFF 窗口
   */
  closeWindow(): void {
    try {
      this.liffSdkService.closeWindow();
    } catch (error) {
      console.error('Close window error:', error);
      throw error;
    }
  }

  /**
   * 打開分享對話框
   */
  async shareTargetPicker(text: string): Promise<LiffShareResultDto> {
    try {
      return await this.liffSdkService.shareTargetPicker(text);
    } catch (error) {
      console.error('Share target picker error:', error);
      throw error;
    }
  }

  /**
   * 掃描 QR 碼
   */
  async scanQrCode(): Promise<{ value: string } | null> {
    try {
      return await this.liffSdkService.scanQrCode();
    } catch (error) {
      console.error('Scan QR code error:', error);
      throw error;
    }
  }
}
