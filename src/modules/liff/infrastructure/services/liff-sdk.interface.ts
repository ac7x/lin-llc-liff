// filepath: /workspaces/next-liff-template/src/modules/liff/infrastructure/services/liff-sdk.interface.ts
import { LiffContextDto, LiffFriendshipDto, LiffLoginResultDto, LiffMessageDto, LiffShareResultDto, LiffUserDto } from "../../application/dtos/liff-user.dto";

/**
 * LINE Profile 介面定義
 * 與 LIFF SDK 的 getProfile() 返回值對應
 */
export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * LIFF 環境上下文介面定義
 * 與 LIFF SDK 的 getContext() 返回值對應
 */
export interface LineContext {
  liffId: string;
  type: string;
  viewType: string;
  userId?: string;
}

/**
 * LIFF SDK 類型定義
 * 這是簡化版的 LIFF SDK 類型，適用於本項目
 */
export interface LiffSDK {
  init(config: { liffId: string; withLoginOnExternalBrowser?: boolean }): Promise<void>;
  isLoggedIn(): boolean;
  login(options?: { redirectUri?: string }): void;
  logout(): void;
  getProfile(): Promise<LineProfile>;
  getContext(): LineContext | null;
  getOS(): string | undefined;
  isInClient(): boolean;
  openWindow(options: { url: string; external: boolean }): void;
  closeWindow(): void;
  getLanguage(): string | undefined;
  getVersion(): string | undefined;
  getLineVersion(): string | undefined;
  getFriendship(): Promise<{ friendFlag: boolean }>;
  shareTargetPicker(messages: LiffMessageDto[]): Promise<{ status: string } | undefined>;
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
