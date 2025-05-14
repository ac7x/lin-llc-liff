// src/modules/liff/infrastructure/services/liff-profile-raw.type.ts

/**
 * 對應 liff.getProfile() 回傳型別（不含 email）
 * 參考官方文件: https://developers.line.biz/en/reference/liff/#get-profile
 */
export interface LiffProfileRaw {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  // 這裡不含 email，若有需額外擴充
  [key: string]: unknown; // 允許擴充
}
