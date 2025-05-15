import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js + DDD + CQRS 進階架構範本",
  description: "現代化 Next.js 架構，結合 DDD、CQRS、分層、最佳實踐，適用於大型專案起手式。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 注意：不將 LIFF 相關邏輯放在根佈局中
  // 原因：1. 關注點分離，LIFF 只在特定路由下使用
  // 2. 避免在不需要 LIFF 的頁面加載其代碼
  // 3. 遵循 DDD 模式，保持模組的獨立性
  
  return (
    <html lang="zh-Hant">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
          {children}
      </body>
    </html>
  );
}
