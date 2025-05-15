'use client';

import { LiffIdValueObject } from '@/modules/liff/domain/valueObjects/liff-id.value-object';
import { LiffActionButtons } from '@/modules/liff/interfaces/components/liff-action-buttons';
import { LiffInfoCard } from '@/modules/liff/interfaces/components/liff-info-card';
import { LiffProfileCard } from '@/modules/liff/interfaces/components/liff-profile-card';

export default function ProfilePage() {
  // 使用硬編碼的 LIFF ID 替代環境變數
  const LIFF_ID = LiffIdValueObject.getDefaultLiffId().value;

  return (
    <main className="py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">LINE 用戶資料</h1>

      <div className="space-y-6">
        <LiffProfileCard />
        <LiffInfoCard />
        <LiffActionButtons />

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="font-medium text-lg mb-2">關於此頁面</h3>
          <p className="text-sm text-gray-600">
            此頁面使用了 Next.js + DDD + CQRS 架構實現 LIFF 功能。
            透過將 LIFF ID 硬編碼為 <code className="bg-gray-100 p-1 rounded text-xs">{LIFF_ID}</code>，
            簡化了配置過程，不需要依賴環境變數。
          </p>
        </div>
      </div>
    </main>
  );
}