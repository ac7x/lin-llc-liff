import { IFirebaseClientQueryRepository } from '@/modules/shared/domain/repositories/firebase-client-query-repository.interface';
import { FirebaseClientQueryRepository } from './firebase-client-query.repository';

/**
 * Firebase 客戶端儲存庫工廠類
 * 符合依賴倒置原則，提供儲存庫實例
 */
export class FirebaseClientRepositoryFactory {
  /**
   * 獲取 Firebase 客戶端查詢儲存庫實例
   * @returns 符合 IFirebaseClientQueryRepository 接口的實例
   */
  static createQueryRepository(): IFirebaseClientQueryRepository {
    return new FirebaseClientQueryRepository();
  }
}
