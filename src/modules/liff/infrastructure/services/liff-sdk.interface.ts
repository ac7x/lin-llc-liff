import { LiffContextDto, LiffFriendshipDto, LiffLoginResultDto, LiffShareResultDto, LiffUserDto } from "../../application/dtos/liff-user.dto";

/**
 * LIFF SDK 類型定義
 * 這是簡化版的 LIFF SDK 類型，適用於本項目
 */
export interface LiffSDK {
  init(config: { liffId: string; withLoginOnExternalBrowser?: boolean }): Promise<void>;
  isLoggedIn(): boolean;
  login(options?: { redirectUri?: string }): void;
  logout(): void;
  getProfile(): Promise<LiffUserDto>;
  getContext(): LiffContextDto | null;
  getOS(): string | undefined;
  isInClient(): boolean;
  openWindow(options: { url: string; external: boolean }): void;
  closeWindow(): void;
  getLanguage(): string | undefined;
  getVersion(): string | undefined;
  getLineVersion(): string | undefined;
  getFriendship(): Promise<LiffFriendshipDto>;
  shareTargetPicker(messages: Array<{ type: string; text: string }>): Promise<{ status: string } | undefined>;
  scanCodeV2(): Promise<{ value: string }>;
}

/**
 * LIFF SDK 服務介面
 * 定義與 LIFF SDK 互動的方法契約
 */
export interface LiffSdkServiceInterface {
  initialize(liffId?: string): Promise<boolean>;
  isLoggedIn(): boolean;
  login(): Promise<LiffLoginResultDto>;
  logout(): void;
  getProfile(): Promise<LiffUserDto>;
  getContext(): LiffContextDto | null;
  getOS(): string | null;
  isInClient(): boolean;
  openWindow(url: string, external: boolean): void;
  closeWindow(): void;
  getLanguage(): string | null;
  getLiffVersion(): string | null;
  getLineVersion(): string | null;
  getFriendship(): Promise<LiffFriendshipDto>;
  shareTargetPicker(text: string): Promise<LiffShareResultDto>;
  scanQrCode(): Promise<{ value: string } | null>;
}
