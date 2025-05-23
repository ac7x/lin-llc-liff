import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 開啟 React 嚴格模式，有助於開發時發現潛在問題
  reactStrictMode: true,
  // 使用 SWC 進行更快的 JS 壓縮
  swcMinify: true,
  // 使網址統一以斜線結尾，提升一致性與 SEO
  trailingSlash: true,
  // 設定允許載入的外部圖片來源（如有 CDN 請補充 domain）
  images: {
    domains: [
      'profile.line-scdn.net'
      // , 'your-cdn.com'
    ],
  },
  // TypeScript 嚴格檢查，建議 production 關閉 ignore
  typescript: {
    ignoreBuildErrors: false,
  },
  // 建議 CI/CD 保持 ESLint 檢查
  eslint: {
    ignoreDuringBuilds: false,
  },
  // 僅放非敏感、前端會用到的環境變數
  env: {
    LIFF_ID: process.env.LIFF_ID,
    PUBLIC_LINE_BOT_ID: process.env.PUBLIC_LINE_BOT_ID,
    LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID,
    LINE_PAY_CHANNEL_ID: process.env.LINE_PAY_CHANNEL_ID,
    LINE_PAY_API_URL: process.env.LINE_PAY_API_URL,
    BASE_URL: process.env.BASE_URL,
  },
};

export default nextConfig;