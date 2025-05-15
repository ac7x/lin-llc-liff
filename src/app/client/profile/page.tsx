'use client';

import { GlobalBottomNav } from '@/modules/shared/interfaces/navigation/GlobalBottomNav';

export default function ProfilePage() {
  return (
    <>
      <main className="py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">LINE 用戶資料</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-medium text-lg mb-2">關於此頁面</h3>
            <p className="text-sm text-gray-600">
              此頁面已移除 LIFF 相關功能與元件，僅保留頁面結構與說明。
            </p>
          </div>
        </div>
      </main>
      <GlobalBottomNav />
    </>
  );
}