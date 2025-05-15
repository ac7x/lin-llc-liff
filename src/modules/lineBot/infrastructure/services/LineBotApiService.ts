import { ILineBotMessageSender } from '@/modules/c-lineBot/domain/interfaces/ILineBotMessageSender';
import { MessageObject } from '@/modules/c-lineBot/domain/types/LineTypes';
import axios from 'axios';

export class LineBotApiService implements ILineBotMessageSender {
  // 更新到 v3 端點
  private readonly baseURL = 'https://api.line.me/v3/bot';

  constructor(
    private readonly channelAccessToken: string,
    private readonly channelSecret: string
  ) { }

  async sendReply(replyToken: string, message: MessageObject | MessageObject[]): Promise<void> {
    await axios.post(
      `${this.baseURL}/message/reply`,
      {
        replyToken,
        messages: Array.isArray(message) ? message : [message],
        // v3 API 支援的新選項
        notificationDisabled: false,
      },
      {
        headers: {
          Authorization: `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  async sendPush(userId: string, message: MessageObject | MessageObject[]): Promise<void> {
    await axios.post(
      `${this.baseURL}/message/push`,
      {
        to: userId,
        messages: Array.isArray(message) ? message : [message],
        // v3 API 新增選項
        notificationDisabled: false,
      },
      {
        headers: {
          Authorization: `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // 新增 v3 API 的多媒體內容獲取方法
  async getMessageContent(messageId: string): Promise<Buffer> {
    const response = await axios.get(`${this.baseURL}/message/${messageId}/content`, {
      headers: {
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  }
}
