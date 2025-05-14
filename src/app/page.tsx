import React from 'react';

export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-4 text-[#00B900]">Next.js + DDD + CQRS 進階架構範本</h1>
      <p className="mb-6 text-gray-700 text-lg">
        本專案提供現代化 Next.js 架構，結合 <b>DDD</b>（領域驅動設計）、<b>CQRS</b>（命令查詢責任分離）、分層設計與最佳實踐，適用於大型、可擴展的企業級應用。
      </p>
      <ul className="list-disc pl-6 mb-6 text-gray-800">
        <li>嚴謹分層（Interface / Application / Domain / Infrastructure）</li>
        <li>契約優先、型別安全、可測試性高</li>
        <li>支援 Server Actions、Server Components、Prisma、Firebase</li>
        <li>完善檔案結構與命名規範</li>
        <li>可擴充的模組化設計</li>
      </ul>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">快速開始</h2>
        <ol className="list-decimal pl-6 text-gray-700">
          <li>閱讀 <code>.github/codegen.md</code> 了解架構規範</li>
          <li>依照 <b>src/modules</b> 範例建立你的業務模組</li>
          <li>善用 <b>Application</b> 層協調流程，<b>Domain</b> 層封裝核心邏輯</li>
          <li>使用 <b>Infrastructure</b> 層整合資料庫與外部服務</li>
        </ol>
      </div>
      <footer className="text-center text-xs text-gray-400 mt-12">
        &copy; {new Date().getFullYear()} Next.js DDD CQRS Template
      </footer>
    </main>
  );
}
