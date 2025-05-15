import { Message } from '@line/bot-sdk';

export interface LineBotRepository {
    pushMessage(to: string, messages: Message | Message[]): Promise<void>;
    replyMessage(replyToken: string, messages: Message | Message[]): Promise<void>;
}
