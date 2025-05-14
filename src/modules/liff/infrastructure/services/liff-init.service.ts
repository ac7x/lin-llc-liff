// src/modules/liff/infrastructure/services/liff-init.service.ts
import liff from '@line/liff';
import { LiffProfile } from '../../domain/models/liff-profile.type';

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
  async getProfile(): Promise<LiffProfile> {
    if (!liff.isLoggedIn()) throw new Error('Not logged in');
    // 先轉型為 unknown，再轉為 Record<string, unknown>，以符合 TypeScript 型別安全
    const profile = await liff.getProfile() as unknown as Record<string, unknown>;
    return {
      userId: profile.userId as string,
      displayName: profile.displayName as string,
      pictureUrl: (profile.pictureUrl as string) || '',
      statusMessage: profile.statusMessage as string | undefined,
      email: typeof profile["email"] === "string" ? (profile["email"] as string) : undefined,
    };
  }
}
