
import { FirebaseTestDocumentDto } from "@/modules/shared/application/queries/dtos/firebase-test-document.dto";

/**
 * Firebase 測試文檔數據介面
 * 定義要寫入的數據格式
 */
export interface FirebaseTestDocumentData {
  message: string;
  timestamp: string;
  createdAt: string;
  userId: string;
  [key: string]: unknown;
}

/**
 * Firebase 客戶端查詢儲存庫接口
 * 定義與 Firebase 客戶端交互的數據查詢和寫入操作
 */
export interface IFirebaseClientQueryRepository {
  /**
   * 寫入測試文檔
   * @param data 要寫入的數據
   * @returns 寫入的文檔ID
   */
  writeTestDocument(data: FirebaseTestDocumentData): Promise<string>;
  
  /**
   * 獲取測試文檔
   * @param docId 文檔ID
   * @returns 文檔數據或 null (如果不存在)
   */
  getTestDocument(docId: string): Promise<FirebaseTestDocumentDto | null>;
}
