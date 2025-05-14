'use client';

import { useEffect, useState } from 'react';
import { LiffLoginButton, LiffLogoutButton } from '../../modules/liff/interfaces/components/liff-login-button';
import { LiffUserCard } from '../../modules/liff/interfaces/components/liff-user-card';
import { LiffProvider } from '../../modules/liff/interfaces/contexts/liff-context';
import { useLiff } from '../../modules/liff/interfaces/hooks/use-liff';

// LIFF ID 應該來自環境變數
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';

/**
 * LIFF 示例內容組件
 * 展示 LIFF 登入狀態與操作
 */
function LiffDemoContent() {
  const { isInitialized, isLoggedIn, userProfile, isLoading, error } = useLiff();

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">LIFF 狀態</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">初始化狀態:</div>
          <div>{isInitialized ? '✅ 已初始化' : '❌ 未初始化'}</div>
          
          <div className="font-medium">登入狀態:</div>
          <div>{isLoggedIn ? '✅ 已登入' : '❌ 未登入'}</div>
          
          <div className="font-medium">載入狀態:</div>
          <div>{isLoading ? '⏳ 載入中...' : '✅ 已完成'}</div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-2">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">使用者資訊</h2>
        <LiffUserCard />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">操作</h2>
        <div className="flex space-x-2">
          <LiffLoginButton className="flex-1" />
          <LiffLogoutButton className="flex-1" />
        </div>
      </div>
      
      {userProfile && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">用戶資料 (JSON)</h2>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(userProfile, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * LINE 登入頁面
 * 整合 LIFF 登入功能的示例頁面
 */
export default function LinePage() {
  const [isBrowser, setIsBrowser] = useState(false);
  
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  if (!isBrowser) {
    // 在服務器端渲染時不載入 LIFF
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>載入中...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">LINE 登入整合</h1>
        <p className="text-gray-600">使用 LIFF 進行 LINE 身份驗證的示例</p>
      </div>
      
      {LIFF_ID ? (
        <LiffProvider liffId={LIFF_ID}>
          <LiffDemoContent />
        </LiffProvider>
      ) : (
        <div className="max-w-md mx-auto bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-700">
            請設置 <code>NEXT_PUBLIC_LIFF_ID</code> 環境變數
          </p>
        </div>
      )}
    </div>
  );
}
