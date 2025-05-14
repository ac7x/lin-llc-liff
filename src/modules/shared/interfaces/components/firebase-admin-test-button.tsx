'use client';

import { useState } from 'react';
import { testFirebaseAdminWrite, testClientSubmittedWrite } from '@/modules/shared/application/commands/firebase-write-test.action';

/**
 * Firebase Admin 測試寫入按鈕
 * 使用 Server Action 在伺服器端通過 Admin SDK 寫入數據
 */
export default function FirebaseAdminTestButton() {
  const [status, setStatus] = useState<{
    loading: boolean;
    success?: boolean;
    docId?: string;
    error?: string;
  }>({ loading: false });
  
  const [formStatus, setFormStatus] = useState<{
    loading: boolean;
    success?: boolean;
    docId?: string;
    error?: string;
  }>({ loading: false });

  /**
   * 測試伺服器端 Firebase Admin 寫入功能
   */
  const testAdminWrite = async () => {
    setStatus({ loading: true });
    try {
      const result = await testFirebaseAdminWrite();
      
      if (result.success) {
        setStatus({
          loading: false,
          success: true,
          docId: result.docId,
        });
      } else {
        setStatus({
          loading: false,
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        error: (error as Error).message,
      });
    }
  };

  /**
   * 提交表單測試 Firebase Admin 寫入客戶端輸入的數據
   */
  const handleFormSubmit = async (formData: FormData) => {
    setFormStatus({ loading: true });
    try {
      const result = await testClientSubmittedWrite(formData);
      
      if (result.success) {
        setFormStatus({
          loading: false,
          success: true,
          docId: result.docId,
        });
      } else {
        setFormStatus({
          loading: false,
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      setFormStatus({
        loading: false,
        success: false,
        error: (error as Error).message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 測試 Firebase Admin 簡單寫入 */}
      <div className="mb-4">
        <button
          onClick={testAdminWrite}
          disabled={status.loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          {status.loading ? '寫入中...' : '測試 Firebase Admin 寫入'}
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
      
      {/* 測試 Firebase Admin 處理表單輸入 */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">客戶端輸入資料測試</h3>
        <form action={handleFormSubmit} className="space-y-3">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              訊息內容
            </label>
            <input 
              type="text" 
              name="message" 
              id="message" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder="輸入要保存的訊息"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={formStatus.loading}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {formStatus.loading ? '處理中...' : '提交訊息到 Firebase'}
          </button>
          
          {formStatus.success === true && (
            <p className="mt-2 text-green-600 text-sm">
              寫入成功！文檔 ID: {formStatus.docId}
            </p>
          )}
          
          {formStatus.success === false && (
            <p className="mt-2 text-red-600 text-sm">
              寫入失敗: {formStatus.error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
