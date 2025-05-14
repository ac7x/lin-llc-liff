import { LiffConfigDto, LiffContextDto, LiffProfileDto } from '../dtos/liff-profile.dto';

/**
 * LIFF SDK 服務介面
 * 定義與 LIFF SDK 互動的方法契約
 */
export interface LiffSdkServiceInterface {
  initialize(config: LiffConfigDto): Promise<boolean>;
  isLoggedIn(): boolean;
  login(): Promise<void>;
  logout(): Promise<void>;
  getProfile(): Promise<LiffProfileDto>;
  getContext(): LiffContextDto | null;
  getOS(): string;
  isInClient(): boolean;
  openWindow(url: string, external?: boolean): void;
  closeWindow(): void;
}

/**
 * LIFF SDK 服務實現
 * 封裝對 LIFF SDK 的呼叫邏輯
 */
export class LiffSdkService implements LiffSdkServiceInterface {
  private liff: any = null;

  /**
   * 設置 LIFF SDK 實例
   */
  setLiffInstance(liffInstance: any): void {
    this.liff = liffInstance;
  }

  /**
   * 獲取 LIFF SDK 實例
   */
  getLiffInstance(): any {
    if (!this.liff) {
      throw new Error('LIFF SDK has not been initialized');
    }
    return this.liff;
  }

  /**
   * 初始化 LIFF SDK
   */
  async initialize(config: LiffConfigDto): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      
      // 動態引入 LIFF SDK
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      
      // 初始化 LIFF SDK
      await liff.init({
        liffId: config.liffId,
        withLoginOnExternalBrowser: config.withLoginOnExternalBrowser || false
      });
      
      this.liff = liff;
      return true;
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否已登入
   */
  isLoggedIn(): boolean {
    if (!this.liff) return false;
    return this.liff.isLoggedIn();
  }

  /**
   * 登入 LIFF
   */
  async login(): Promise<void> {
    if (!this.liff) throw new Error('LIFF SDK has not been initialized');
    return this.liff.login();
  }

  /**
   * 登出 LIFF
   */
  async logout(): Promise<void> {
    if (!this.liff) throw new Error('LIFF SDK has not been initialized');
    return this.liff.logout();
  }

  /**
   * 取得用戶資料
   */
  async getProfile(): Promise<LiffProfileDto> {
    if (!this.liff) throw new Error('LIFF SDK has not been initialized');
    if (!this.liff.isLoggedIn()) {
      throw new Error('User is not logged in');
    }
    
    try {
      return await this.liff.getProfile();
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  /**
   * 取得 LIFF Context 資訊
   */
  getContext(): LiffContextDto | null {
    if (!this.liff) return null;
    
    try {
      return this.liff.getContext();
    } catch (error) {
      console.error('Error getting context:', error);
      return null;
    }
  }

  /**
   * 取得作業系統資訊
   */
  getOS(): string {
    if (!this.liff) return '';
    
    try {
      return this.liff.getOS();
    } catch (error) {
      console.error('Error getting OS:', error);
      return '';
    }
  }

  /**
   * 檢查是否在 LINE App 內
   */
  isInClient(): boolean {
    if (!this.liff) return false;
    
    try {
      return this.liff.isInClient();
    } catch (error) {
      console.error('Error checking if in client:', error);
      return false;
    }
  }

  /**
   * 開啟網址
   */
  openWindow(url: string, external: boolean = false): void {
    if (!this.liff) throw new Error('LIFF SDK has not been initialized');
    
    try {
      this.liff.openWindow({ url, external });
    } catch (error) {
      console.error('Error opening window:', error);
      throw error;
    }
  }

  /**
   * 關閉 LIFF 視窗
   */
  closeWindow(): void {
    if (!this.liff) throw new Error('LIFF SDK has not been initialized');
    
    try {
      this.liff.closeWindow();
    } catch (error) {
      console.error('Error closing window:', error);
      throw error;
    }
  }
}
