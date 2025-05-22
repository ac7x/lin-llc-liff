import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import React from 'react';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="p-8 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl font-bold mb-4">管理儀表板</h1>
      <p className="text-gray-700">這是管理端儀表板的基礎結構。</p>
      <ManagementBottomNav />
    </div>
  );
};

export default AdminDashboardPage;
