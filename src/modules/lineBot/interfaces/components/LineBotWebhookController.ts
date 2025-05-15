import { getLineBotApplicationService } from '@/modules/c-lineBot/infrastructure/di/lineBotServiceProvider';

export class LineBotWebhookController {
  async handleWebhookRequest(body: string, signature: string) {
    try {
      const applicationService = getLineBotApplicationService();
      await applicationService.handleWebhook(body, signature);
      return { success: true };
    } catch (error) {
      if ((error as Error).message === '無效的簽名') {
        return { error: 'Invalid signature', status: 401 };
      }
      console.error('LINE Webhook 控制器錯誤:', error);
      return { error: 'Internal server error', status: 500 };
    }
  }
}

// 單例模式
const controller = new LineBotWebhookController();
export default controller;
