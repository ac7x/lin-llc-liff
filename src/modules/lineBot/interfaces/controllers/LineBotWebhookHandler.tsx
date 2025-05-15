'use client';

import { handleWebhook } from '@/modules/c-lineBot/application/actions/lineBotActions';
import { useEffect } from 'react';

export function LineBotWebhookHandler() {
  useEffect(() => {
    // 監聽 webhook 請求
    // 這只是概念性的示範，實際上您需要使用一個伺服器來接收 LINE 平台的請求
    async function processIncomingWebhook(event: MessageEvent) {
      const { body, signature } = event.data;
      await handleWebhook(body, signature);
    }

    // 添加事件監聽器
    window.addEventListener('line-webhook', processIncomingWebhook as any);

    // 清理函數
    return () => {
      window.removeEventListener('line-webhook', processIncomingWebhook as any);
    };
  }, []);

  return null; // 這是一個純功能性組件，不需要渲染任何內容
}
