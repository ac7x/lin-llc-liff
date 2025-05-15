import { LiffLoginResultDto, LiffShareResultDto } from "../dtos/liff-user.dto";

/**
 * LIFF 命令服務介面
 * 處理與 LIFF 相關的修改操作
 */
export interface LiffCommandServiceInterface {
  /**
   * 初始化 LIFF SDK
   */
  initialize(liffId?: string): Promise<boolean>;
  
  /**
   * 登入 LIFF
   */
  login(): Promise<LiffLoginResultDto>;
  
  /**
   * 登出 LIFF
   */
  logout(): Promise<void>;
  
  /**
   * 開啟外部窗口
   */
  openWindow(url: string, external: boolean): void;
  
  /**
   * 關閉 LIFF 窗口
   */
  closeWindow(): void;
  
  /**
   * 打開分享對話框
   */
  shareTargetPicker(text: string): Promise<LiffShareResultDto>;
  
  /**
   * 掃描 QR 碼
   */
  scanQrCode(): Promise<{ value: string } | null>;
}
