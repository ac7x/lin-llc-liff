import { LiffIdValueObject } from '@/modules/liff/domain/valueObjects/liff-id.value-object';
import { LiffProvider } from '@/modules/liff/interfaces/contexts/liff-context';
import { GlobalBottomNav } from '@/modules/shared/interfaces/navigation/GlobalBottomNav';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";
import "./globals.css";

// 字型設定：Geist Sans & Mono
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 頁面中繼資料
export const metadata: Metadata = {
  title: "Next.js + DDD + CQRS 進階架構範本",
  description: "現代化 Next.js 架構，結合 DDD、CQRS、分層、最佳實踐，適用於大型專案起手式。",
};

// 整合版 Layout 元件
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 從 ValueObject 獲取 LIFF ID，確保符合領域驅動設計原則
  const LIFF_ID = LiffIdValueObject.getDefaultLiffId().value;

  return (
    <html lang="zh-Hant">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
        {/* 
          注意：我們選擇在這裡初始化 LIFF 而不是在根佈局外部模組
          原因：
          1. 關注點分離 — LIFF 僅在特定模組中使用
          2. 更符合 DDD — LIFF 功能只在需要的模組中加載
          3. 性能優化 — admin 等其他路由不需要加載 LIFF
        */}
        <LiffProvider liffId={LIFF_ID}>
          <div className="pb-16 max-w-lg mx-auto">
            {children}
            <GlobalBottomNav />
          </div>
        </LiffProvider>
      </body>
    </html>
  );
}
