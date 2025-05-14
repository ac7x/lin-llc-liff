import { LiffUserEntity } from '../entities/liff-user.entity';
import { LineUserIdValueObject } from '../valueObjects/liff-id.value-object';

/**
 * LIFF 用戶儲存庫介面
 * 定義與持久化 LIFF 用戶數據相關的操作契約
 */
export interface LiffUserRepository {
  /**
   * 通過 LINE User ID 查找 LIFF 用戶
   */
  findById(id: LineUserIdValueObject): Promise<LiffUserEntity | null>;
  
  /**
   * 保存 LIFF 用戶
   */
  save(user: LiffUserEntity): Promise<void>;
  
  /**
   * 更新 LIFF 用戶登入狀態
   */
  updateLoginStatus(id: LineUserIdValueObject, isLoggedIn: boolean): Promise<void>;
  
  /**
   * 刪除 LIFF 用戶
   */
  delete(id: LineUserIdValueObject): Promise<void>;
}
