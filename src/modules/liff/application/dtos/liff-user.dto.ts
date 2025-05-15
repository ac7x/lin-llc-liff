/**
 * LIFF 用戶資料傳輸物件
 */
export interface LiffUserDto {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  isLoggedIn: boolean;
}

/**
 * LIFF 上下文資料傳輸物件
 */
export interface LiffContextDto {
  liffId: string;
  type: string;
  viewType: string;
  userId?: string;
  isInClient: boolean;
}

/**
 * LIFF 好友資訊資料傳輸物件
 */
export interface LiffFriendshipDto {
  friendFlag: boolean;
}

/**
 * LIFF 設定資料傳輸物件
 */
export interface LiffConfigDto {
  liffId: string;
  withLoginOnExternalBrowser?: boolean;
}

/**
 * LIFF 登入資料傳輸物件
 */
export interface LiffLoginResultDto {
  isLoggedIn: boolean;
  userId?: string;
  displayName?: string;
}

/**
 * LIFF 分享結果資料傳輸物件
 */
export interface LiffShareResultDto {
  status: string;
  success: boolean;
}
