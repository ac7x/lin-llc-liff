'use client'

import { useLiff } from "@/modules/liff/interfaces";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav"; // 引入 GlobalBottomNav
import { useEffect, useState } from "react";
import { testFirebaseWrite } from "./actions/test-firebase";

export default function HomePage() {
  const { state } = useLiff();
  const [showToast, setShowToast] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (state.isInitialized) {
      // 當 LIFF 初始化後，顯示提示
      setShowToast(true);

      // 一秒後隱藏提示
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 1000);

      // 清理計時器
      return () => clearTimeout(timer);
    }
  }, [state.isInitialized]);

  // Firebase 寫入測試處理函數
  const handleTestFirebaseWrite = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const result = await testFirebaseWrite();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative pb-16 px-4 py-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Home Page</h1>

      {/* Firebase 寫入測試卡片 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-3">Firebase Admin 測試</h2>
        <button
          onClick={handleTestFirebaseWrite}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white ${isLoading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
        >
          {isLoading ? '處理中...' : '測試 Firebase 寫入'}
        </button>

        {testResult && (
          <div className={`mt-4 p-3 rounded-md ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            <p className="font-medium">{testResult.success ? '✅ 成功' : '❌ 失敗'}</p>
            <p className="text-sm mt-1">{testResult.message}</p>
          </div>
        )}
      </div>

      {/* 初始化成功提示 */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity">
          LIFF 初始化成功
        </div>
      )}
      <GlobalBottomNav /> {/* 添加 GlobalBottomNav */}
    </main>
  );
}
