import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import React from 'react';

const AdminWorkAssetPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">用戶資產清單</h1>
      <p className="text-gray-700 mb-4">這裡可檢視所有用戶的資產資料。</p>
      {/* TODO: 資產資料表格未來可於此顯示 */}
      <ManagementBottomNav />
    </div>
  );
};

export default AdminWorkAssetPage;
