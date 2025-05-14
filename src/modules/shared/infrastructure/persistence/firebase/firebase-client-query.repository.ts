import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { getAuthClient, getFirestoreClient } from './firebase-client';
import { 
  IFirebaseClientQueryRepository, 
  FirebaseTestDocumentData 
} from '@/modules/shared/domain/repositories/firebase-client-query-repository.interface';
import { FirebaseTestDocumentDto } from '@/modules/shared/application/queries/dtos/firebase-test-document.dto';

/**
 * Firebase 客戶端查詢儲存庫實現
 * 實現客戶端 Firebase 數據操作
 */
export class FirebaseClientQueryRepository implements IFirebaseClientQueryRepository {
  /**
   * 寫入測試文檔到 Firebase
   * @param data 要寫入的測試數據
   * @returns 寫入的文檔 ID
   */
  async writeTestDocument(data: FirebaseTestDocumentData): Promise<string> {
    try {
      const firestore = getFirestoreClient();
      const auth = getAuthClient();
      const currentUser = auth.currentUser;
      
      // 確保數據安全性：添加用戶 ID 和服務器時間戳
      const testData = {
        ...data,
        userId: currentUser?.uid || data.userId || 'anonymous',
        timestamp: serverTimestamp(), 
      };
      
      // 使用 test_client_writes 集合，用於客戶端寫入的測試數據
      // 這個集合應該在 Firestore 安全規則中允許已驗證用戶寫入
      const testCollection = collection(firestore, 'test_client_writes');
      const docRef = await addDoc(testCollection, testData);
      
      return docRef.id;
    } catch (error) {
      console.error('Firebase client write repository error:', error);
      throw error;
    }
  }

  /**
   * 從 Firebase 獲取測試文檔
   * @param docId 文檔ID
   * @returns 文檔數據或 null (如果不存在)
   */
  async getTestDocument(docId: string): Promise<FirebaseTestDocumentDto | null> {
    try {
      const firestore = getFirestoreClient();
      const docRef = doc(firestore, 'test_client_writes', docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      
      // 轉換 Firebase 的 Timestamp 為 ISO 字符串
      const processedData = this.processTimestamps(data);
      
      return {
        id: docSnap.id,
        ...processedData
      } as FirebaseTestDocumentDto;
    } catch (error) {
      console.error('Firebase client read repository error:', error);
      throw error;
    }
  }
  
  /**
   * 轉換文檔中的 Timestamp 為 ISO 字符串
   * @param data 包含可能的 Timestamp 字段的數據
   * @returns 處理後的數據
   */
  private processTimestamps(data: DocumentData): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value instanceof Timestamp) {
        result[key] = value.toDate().toISOString();
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.processTimestamps(value as DocumentData);
      } else {
        result[key] = value;
      }
    });
    
    return result;
  }
}
