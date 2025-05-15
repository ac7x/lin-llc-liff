import { MessageObject } from '../types/LineTypes';

export interface ILineBotMessageSender {
  sendReply(replyToken: string, message: MessageObject | MessageObject[]): Promise<void>;
  sendPush(userId: string, message: MessageObject | MessageObject[]): Promise<void>;
  getMessageContent(messageId: string): Promise<Buffer>;
}
