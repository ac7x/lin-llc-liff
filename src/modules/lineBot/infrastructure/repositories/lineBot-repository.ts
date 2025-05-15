import { Client, ClientConfig, Message } from '@line/bot-sdk';
import { LineBotRepository } from '../../domain/repositories/lineBot-repository.interface';

export class LineBotRepositoryImpl implements LineBotRepository {
    private client: Client;

    constructor(config: ClientConfig) {
        this.client = new Client(config);
    }

    async pushMessage(to: string, messages: Message | Message[]): Promise<void> {
        await this.client.pushMessage(to, messages);
    }

    async replyMessage(replyToken: string, messages: Message | Message[]): Promise<void> {
        await this.client.replyMessage(replyToken, messages);
    }
}
