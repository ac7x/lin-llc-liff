import { LiffProvider } from "@/app/Liff";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

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
  return (
    <html lang="zh-Hant">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
        <LiffProvider>
          <div className="pb-16 max-w-lg mx-auto">
            {children}
          </div>
        </LiffProvider>
      </body>
    </html>
  );
}