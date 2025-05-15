import { LiffUserEntity } from "../entities/liff-user.entity";

/**
 * LIFF 用戶儲存庫介面
 * 定義與 LIFF 用戶相關的資料存取操作
 */
export interface LiffUserRepository {
  /**
   * 根據 userId 取得用戶
   */
  findById(userId: string): Promise<LiffUserEntity | null>;
  
  /**
   * 儲存用戶資訊
   */
  save(user: LiffUserEntity): Promise<void>;
}
