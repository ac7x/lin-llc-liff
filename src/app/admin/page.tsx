import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import Link from 'next/link';
import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      {/* 左側導覽欄 */}
      <nav className="w-48 bg-gray-100 border-r p-4 flex flex-col gap-4">
        <Link href="/admin/dashboard">
          <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">管理儀表板</button>
        </Link>
        <Link href="/admin/workskill">
          <button className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition">技能表</button>
        </Link>
        <Link href="/admin/workasset">
          <button className="w-full py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition">用戶資產</button>
        </Link>
      </nav>
      {/* 右側內容區塊 */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">管理主頁</h1>
        <p className="text-gray-700">請使用左側選單切換管理功能。</p>
      </main>
      <ManagementBottomNav />
    </div>
  );
};

export default AdminPage;
