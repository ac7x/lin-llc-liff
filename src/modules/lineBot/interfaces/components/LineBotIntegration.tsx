'use client';

import { useLiff } from '@/modules/c-liff/interfaces/hooks/useLiff';
import { useEffect, useState } from 'react';

export function LineBotIntegration() {
  const liff = useLiff();
  const [botStatus, setBotStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    const checkBotConnection = async () => {
      if (liff.isInitialized && liff.isLoggedIn) {
        try {
          // 這裡可以實現檢查 Bot 連接狀態的邏輯
          // 例如，檢查用戶是否已加入 Bot 為好友
          const isFriend = liff.friendship.friendFlag;
          setBotStatus(isFriend ? 'connected' : 'disconnected');
        } catch (error) {
          console.error('檢查 Bot 連接狀態時發生錯誤:', error);
          setBotStatus('disconnected');
        }
      }
    };

    checkBotConnection();
  }, [liff.isInitialized, liff.isLoggedIn, liff.friendship.friendFlag]);

  if (botStatus === 'checking') {
    return <p className="text-[#00B900] mb-4">檢查 LINE Bot 連接狀態中...</p>;
  }

  if (botStatus === 'disconnected') {
    return (
      <div className="mb-4 w-full rounded border border-[#00B900]/20 bg-[#00B900]/5 p-4">
        <h3 className="font-medium text-[#00B900]">尚未連接 LINE Bot</h3>
        <p className="my-2 text-gray-600">請加入我們的官方帳號，以獲得完整功能體驗。</p>
        <button
          className="rounded bg-[#00B900] px-4 py-2 text-white hover:bg-[#00B900]/90 transition-colors"
          onClick={() => {
            if (liff.isInClient) {
              // 在 LINE 應用內打開 Bot 添加頁面
              liff.openExternalWindow(
                `https://line.me/R/ti/p/@${process.env.NEXT_PUBLIC_LINE_BOT_ID}`
              );
            } else {
              // 在瀏覽器中打開 Bot 添加頁面
              window.open(
                `https://line.me/R/ti/p/@${process.env.NEXT_PUBLIC_LINE_BOT_ID}`,
                '_blank'
              );
            }
          }}
        >
          添加官方帳號
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 w-full rounded border border-[#00B900]/20 bg-[#00B900]/5 p-4">
      <h3 className="font-medium text-[#00B900]">LINE Bot 已連接</h3>
      <p className="my-2 text-gray-600">您已成功連接我們的官方帳號，可以使用全部功能。</p>
    </div>
  );
}
