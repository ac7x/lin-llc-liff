import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/user-bottom-nav';
import React from 'react';

const ClientPage: React.FC = () => {
  return (
    <div className="pb-16 text-center">
      <h1>Client Page</h1>
      <p>這是客戶端頁面的基礎結構。</p>
      <ClientBottomNav />
    </div>
  );
};

export default ClientPage;
