import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div className="pb-16 text-center">
      <h1>Admin Page</h1>
      <p>這是管理端頁面的基礎結構。</p>
      <ManagementBottomNav />
    </div>
  );
};

export default AdminPage;
