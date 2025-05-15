import { ILineBotMessageSender } from '@/modules/c-lineBot/domain/interfaces/ILineBotMessageSender';
import { BotVerificationService } from '@/modules/c-lineBot/domain/services/BotVerificationService';
import { LineBotService } from '@/modules/c-lineBot/domain/services/LineBotService';
import { WebhookEvent } from '@line/bot-sdk';

export class LineBotApplicationService {
  constructor(
    private readonly lineBotService: LineBotService,
    private readonly messageSender: ILineBotMessageSender,
    private readonly verificationService: BotVerificationService
  ) { }

  async handleWebhook(body: string, signature: string): Promise<boolean> {
    // 驗證簽名
    const isValid = await this.verificationService.verifySignature(body, signature);
    if (!isValid) {
      throw new Error('無效的簽名');
    }

    try {
      const webhookEvents: WebhookEvent[] = JSON.parse(body).events;
      const botMessages = this.lineBotService.processWebhookEvents(webhookEvents);

      // 對每個事件發送回應
      for (const message of botMessages) {
        await this.messageSender.sendReply(
          this.getReplyToken(webhookEvents, message.userId),
          message.toLineReplyFormat()
        );
      }

      return true;
    } catch (error) {
      console.error('處理 webhook 時發生錯誤:', error);
      throw error;
    }
  }

  private getReplyToken(events: WebhookEvent[], userId: string): string {
    // 找到與訊息相關的事件以獲取 replyToken
    const event = events.find((e) => e.source?.userId === userId && 'replyToken' in e);

    if (!event || !('replyToken' in event)) {
      throw new Error(`沒有找到用戶 ${userId} 的 replyToken`);
    }

    return event.replyToken;
  }
}
