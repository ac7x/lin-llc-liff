'use server';

import { getLineBotApplicationService } from '@/modules/c-lineBot/infrastructure/di/lineBotServiceProvider';

export async function handleWebhook(body: string, signature: string) {
  try {
    const applicationService = getLineBotApplicationService();
    await applicationService.handleWebhook(body, signature);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === '無效的簽名') {
      return { error: 'Invalid signature', status: 401 };
    }
    console.error('處理 LINE Webhook 時發生錯誤:', error);
    return { error: 'Internal server error', status: 500 };
  }
}
