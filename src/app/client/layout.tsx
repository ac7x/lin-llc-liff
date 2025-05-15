'use client';

import { LiffIdValueObject } from '@/modules/liff/domain/valueObjects/liff-id.value-object';
import { LiffProvider } from '@/modules/liff/interfaces/contexts/liff-context';
import { GlobalBottomNav } from '@/modules/shared/interfaces/navigation/GlobalBottomNav';
import React from 'react';

export default function ClientLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // 從 ValueObject 獲取 LIFF ID，確保符合領域驅動設計原則
    const LIFF_ID = LiffIdValueObject.getDefaultLiffId().value;

    return (
        <LiffProvider liffId={LIFF_ID}>
            <div className="pb-16 max-w-lg mx-auto">
                {children}
                <GlobalBottomNav />
            </div>
        </LiffProvider>
    );
}
// 注意：我們選擇在 client layout 中初始化 LIFF 而不是在根佈局
// 優點：
// 1. 更符合 DDD - LIFF 功能只在需要的模組中加載
// 2. 提高可維護性 - LIFF 相關邏輯集中在客戶端路由
// 3. 性能優化 - admin 等其他路由不需要加載 LIFF
