import { WebhookEvent } from '@line/bot-sdk';
import { LineBot } from '../entities/LineBot';
import { BotMessage } from '../valueObjects/BotMessage';

export class LineBotService {
  private bot: LineBot;

  constructor(botId: string) {
    this.bot = new LineBot(botId);
  }

  processWebhookEvents(events: WebhookEvent[]): BotMessage[] {
    // 處理多個 webhook 事件並返回相應的訊息
    return events
      .map((event) => this.bot.processEvent(event))
      .filter((message): message is BotMessage => message !== null);
  }
}
