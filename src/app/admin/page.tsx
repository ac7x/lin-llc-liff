import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav';
import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div className="pb-16 text-center">
      <h1>Admin Page</h1>
      <p>這是管理端頁面的基礎結構。</p>
      <AdminBottomNav />
    </div>
  );
};

export default AdminPage;
