import { Firestore } from 'firebase/firestore';
import { LiffUserRepository } from '../../../domain/repositories/liff-user-repository.interface';
import { LiffUserFirebaseRepository } from '../commands/liff-user-command.repository';
import { LiffUserAdminRepository } from '../commands/liff-user-admin-command.repository';

/**
 * LIFF 用戶儲存庫工廠
 * 負責根據運行環境創建適當的儲存庫實例
 */
export class LiffUserRepositoryFactory {
  /**
   * 創建適合當前環境的 LIFF 用戶儲存庫
   * @param firestore 客戶端 Firestore 實例 (只用於客戶端環境)
   * @returns LiffUserRepository 實例
   */
  public static create(firestore?: Firestore): LiffUserRepository {
    // 在服務器端運行時
    if (typeof window === 'undefined') {
      return new LiffUserAdminRepository();
    }
    
    // 在客戶端運行時
    return new LiffUserFirebaseRepository(firestore);
  }
}
