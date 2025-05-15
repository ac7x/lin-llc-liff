import { Message } from '@line/bot-sdk';
import { LineBotRepository } from '../repositories/lineBot-repository.interface';

export class LineBotDomainService {
    constructor(private readonly repository: LineBotRepository) { }

    async sendPushMessage(to: string, messages: Message | Message[]): Promise<void> {
        await this.repository.pushMessage(to, messages);
    }

    async sendReplyMessage(replyToken: string, messages: Message | Message[]): Promise<void> {
        await this.repository.replyMessage(replyToken, messages);
    }
}
