import { WebhookEvent } from '@line/bot-sdk';
import { BotMessage } from '../valueObjects/BotMessage';
import { BotUser } from '../valueObjects/BotUser';

export class LineBot {
  private readonly _botId: string;

  constructor(botId: string) {
    this._botId = botId;
  }

  get botId(): string {
    return this._botId;
  }

  // 領域邏輯：處理來自用戶的事件
  processEvent(event: WebhookEvent): BotMessage | null {
    // 這裡實現核心領域邏輯 - 根據不同事件類型返回相應的訊息
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId || '';
      const user = new BotUser(userId);
      const receivedMessage = event.message.text;

      // 簡單的回應邏輯 - 可以根據實際需求擴展
      return this.createResponseMessage(receivedMessage, user);
    }

    if (event.type === 'follow') {
      return BotMessage.createWelcomeMessage(event.source.userId || '');
    }

    return null;
  }

  private createResponseMessage(text: string, user: BotUser): BotMessage {
    // 在此可實現更複雜的回應邏輯
    return new BotMessage(`您說：${text}`, user.userId);
  }
}
