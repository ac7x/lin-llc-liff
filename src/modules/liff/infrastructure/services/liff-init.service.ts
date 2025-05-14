// src/modules/liff/infrastructure/services/liff-init.service.ts
import liff from '@line/liff';

export class LiffInitService {
  private readonly liffId: string;

  constructor(liffId: string) {
    this.liffId = liffId;
  }

  /**
   * 初始化 LIFF SDK
   */
  async initialize(): Promise<void> {
    if (!liff.isInClient() && !liff.isLoggedIn()) {
      await liff.init({ liffId: this.liffId });
    }
  }

  /**
   * 檢查是否已登入
   */
  isLoggedIn(): boolean {
    return liff.isLoggedIn();
  }

  /**
   * 執行登入
   */
  login(): void {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  }

  /**
   * 執行登出
   */
  logout(): void {
    if (liff.isLoggedIn()) {
      liff.logout();
    }
  }

  /**
   * 取得使用者 Profile
   */
  async getProfile() {
    if (!liff.isLoggedIn()) throw new Error('Not logged in');
    return await liff.getProfile();
  }
}
