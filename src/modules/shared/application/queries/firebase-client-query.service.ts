import { IFirebaseClientQueryRepository, FirebaseTestDocumentData } from '../../domain/repositories/firebase-client-query-repository.interface';
import { 
  FirebaseTestDocumentDto, 
  FirebaseTestDocumentInputDto, 
  FirebaseTestResultDto 
} from './dtos/firebase-test-document.dto';

/**
 * Firebase 客戶端查詢服務
 * 負責協調 Firebase 客戶端的讀寫操作
 */
export class FirebaseClientQueryService {
  constructor(private readonly firebaseClientQueryRepo: IFirebaseClientQueryRepository) {}

  /**
   * 測試寫入數據到 Firebase
   * @param data 要寫入的測試數據
   * @returns 寫入結果
   */
  async testWrite(data: FirebaseTestDocumentInputDto): Promise<FirebaseTestResultDto> {
    try {
      const testData: FirebaseTestDocumentData = {
        message: data.message,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        userId: data.userId || 'anonymous',
      };
      
      const docId = await this.firebaseClientQueryRepo.writeTestDocument(testData);
      
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
  async getTestDocument(docId: string): Promise<FirebaseTestDocumentDto | null> {
    try {
      return await this.firebaseClientQueryRepo.getTestDocument(docId);
    } catch (error) {
      console.error('Firebase client read failed:', error);
      return null;
    }
  }
}
