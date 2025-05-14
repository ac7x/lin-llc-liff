import React from 'react';
import { GlobalBottomNav } from '@/modules/shared/interfaces/navigation/GlobalBottomNav';

const ClientPage: React.FC = () => {
  return (
    <div className="pb-16">
      <h1>Client Page</h1>
      <p>這是客戶端頁面的基礎結構。</p>
      <GlobalBottomNav />
    </div>
  );
};

export default ClientPage;
