'use client';

import { useState } from 'react';
import { FirebaseClientQueryService } from '@/modules/shared/application/queries/firebase-client-query.service';
import { FirebaseClientRepositoryFactory } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client-repository.factory';

/**
 * Firebase Client 測試寫入按鈕
 * 在客戶端使用 Firebase SDK 寫入數據
 */
export default function FirebaseClientTestButton() {
  const [status, setStatus] = useState<{
    loading: boolean;
    success?: boolean;
    docId?: string;
    error?: string;
  }>({ loading: false });

  /**
   * 測試客戶端 Firebase 寫入功能 - 使用 CQRS 模式
   */
  const testClientWrite = async () => {
    setStatus({ loading: true });
    try {
      // 依賴倒置：使用工廠方法獲取儲存庫實例
      const queryRepository = FirebaseClientRepositoryFactory.createQueryRepository();
      const queryService = new FirebaseClientQueryService(queryRepository);
      
      // 執行測試寫入
      const result = await queryService.testWrite({
        message: 'Test from client side (Firebase Client SDK - CQRS Pattern)',
      });
      
      setStatus({
        loading: false,
        success: result.success,
        docId: result.docId,
        error: result.error,
      });
    } catch (error) {
      console.error('Firebase client write test failed:', error);
      setStatus({
        loading: false,
        success: false,
        error: (error as Error).message,
      });
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={testClientWrite}
        disabled={status.loading}
        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
      >
        {status.loading ? '寫入中...' : '測試 Firebase Client 寫入'}
      </button>
      
      {status.success === true && (
        <p className="mt-2 text-green-600 text-sm">
          寫入成功！文檔 ID: {status.docId}
        </p>
      )}
      
      {status.success === false && (
        <p className="mt-2 text-red-600 text-sm">
          寫入失敗: {status.error}
        </p>
      )}
    </div>
  );
}
