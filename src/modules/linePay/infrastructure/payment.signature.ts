// lib/utils/safeRedirect.ts
import { redirect } from 'next/navigation';

/**
 * 安全地執行 redirect，避免被 try-catch 錯誤地捕捉。
 * 如果是 NEXT_REDIRECT 錯誤會重新丟出，讓 Next.js 處理跳轉。
 */
export function safeRedirect(targetUrl: string) {
  try {
    // 一定要 return，否則無效
    return redirect(targetUrl);
  } catch (error: any) {
    // 如果是 NEXT_REDIRECT，表示是 Next.js 的跳轉機制，應該要重新拋出
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) {
      throw error;
    }

    // 其他錯誤 log 出來方便追蹤
    console.error('[safeRedirect] Failed to redirect:', error);
    throw new Error('safeRedirect failed');
  }
}
