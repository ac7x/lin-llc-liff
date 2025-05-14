/**
 * LIFF 配置文件數據傳輸對象
 */
export interface LiffConfigDto {
  liffId: string;
  withLoginOnExternalBrowser?: boolean;
}

/**
 * LIFF 用戶基本資料數據傳輸對象
 */
export interface LiffProfileDto {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
}

/**
 * LIFF 環境信息數據傳輸對象
 */
export interface LiffContextDto {
  accessTokenHash?: string;
  type?: 'utou' | 'room' | 'group' | 'external' | 'none';
  viewType?: 'compact' | 'tall' | 'full';
  userId?: string;
  groupId?: string;
  roomId?: string;
}
