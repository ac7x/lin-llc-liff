
/**
 * Firebase 測試文檔 DTO
 * 用於在應用層和介面層之間傳輸測試文檔數據
 */
export interface FirebaseTestDocumentDto {
  id: string;
  message: string;
  timestamp: string;
  createdAt: string;
  userId: string;
  [key: string]: unknown; // 允許額外的動態屬性
}

/**
 * Firebase 測試文檔輸入 DTO
 * 用於創建新的測試文檔
 */
export interface FirebaseTestDocumentInputDto {
  message: string;
  userId?: string;
}

/**
 * Firebase 測試文檔結果 DTO
 * 用於返回測試結果
 */
export interface FirebaseTestResultDto {
  success: boolean;
  docId?: string;
  error?: string;
}
