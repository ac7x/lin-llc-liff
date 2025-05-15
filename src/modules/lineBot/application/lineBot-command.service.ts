import { Message } from '@line/bot-sdk';
import { LineBotDomainService } from '../domain/services/lineBot-domain.service';

export class LineBotCommandService {
    constructor(private readonly domainService: LineBotDomainService) { }

    async handlePushMessage(to: string, messages: Message | Message[]): Promise<void> {
        await this.domainService.sendPushMessage(to, messages);
    }

    async handleReplyMessage(replyToken: string, messages: Message | Message[]): Promise<void> {
        await this.domainService.sendReplyMessage(replyToken, messages);
    }
}
