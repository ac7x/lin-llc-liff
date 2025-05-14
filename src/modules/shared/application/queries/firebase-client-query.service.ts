import { FirebaseClientQueryRepository } from '../../infrastructure/persistence/firebase/firebase-client-query.repository';

/**
 * Firebase 客戶端查詢服務
 * 負責協調 Firebase 客戶端的讀寫操作
 */
export class FirebaseClientQueryService {
  constructor(private readonly firebaseClientQueryRepo: FirebaseClientQueryRepository) {}

  /**
   * 測試寫入數據到 Firebase
   * @param data 要寫入的測試數據
   * @returns 寫入結果
   */
  async testWrite(data: {
    message: string;
    userId?: string;
  }): Promise<{ success: boolean; docId?: string; error?: string }> {
    try {
      const docId = await this.firebaseClientQueryRepo.writeTestDocument({
        message: data.message,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        userId: data.userId || 'anonymous',
      });
      
      return { success: true, docId };
    } catch (error) {
      console.error('Firebase client write failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 獲取測試數據
   * @param docId 文檔ID
   * @returns 獲取的文檔數據
   */
  async getTestDocument(docId: string): Promise<any | null> {
    try {
      return await this.firebaseClientQueryRepo.getTestDocument(docId);
    } catch (error) {
      console.error('Firebase client read failed:', error);
      return null;
    }
  }
}
