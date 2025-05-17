import type { Message, TextMessage, WebhookEvent } from '@line/bot-sdk';
import { Client } from '@line/bot-sdk';

export class MessageHandlerService {
    private readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    /**
     * 處理 LINE 平台的 webhook 事件
     */
    async handleEvent(event: WebhookEvent): Promise<void> {
        try {
            console.log('[MessageHandler] 開始處理事件:', {
                type: event.type,
                timestamp: new Date(event.timestamp).toISOString()
            });

            switch (event.type) {
                case 'message':
                    await this.handleMessage(event);
                    break;
                case 'follow':
                    await this.handleFollow(event);
                    break;
                case 'unfollow':
                    await this.handleUnfollow(event);
                    break;
                default:
                    console.log('[MessageHandler] 未處理的事件類型:', event.type);
            }
        } catch (err) {
            console.error('[MessageHandler] 處理事件失敗:', {
                error: err instanceof Error ? err.message : String(err),
                eventType: event.type
            });
            throw err;
        }
    }

    /**
     * 處理訊息事件
     */
    private async handleMessage(event: WebhookEvent): Promise<void> {
        if (event.type !== 'message') return;

        switch (event.message.type) {
            case 'text':
                await this.handleTextMessage(event.replyToken, event.message);
                break;
            default:
                console.log('[MessageHandler] 未處理的訊息類型:', event.message.type);
        }
    }

    /**
     * 處理文字訊息
     */
    private async handleTextMessage(replyToken: string, message: TextMessage): Promise<void> {
        let replyMessage: Message;

        // 根據不同的文字內容回覆不同的訊息
        switch (message.text) {
            case '你好':
            case 'hello':
                replyMessage = {
                    type: 'text',
                    text: '你好！很高興見到你 👋'
                };
                break;
            default:
                replyMessage = {
                    type: 'text',
                    text: `收到您的訊息：${message.text}`
                };
        }

        await this.client.replyMessage(replyToken, replyMessage);
    }

    /**
     * 處理加入好友事件
     */
    private async handleFollow(event: WebhookEvent): Promise<void> {
        if (event.type !== 'follow') return;

        await this.client.replyMessage(event.replyToken, {
            type: 'text',
            text: '感謝您加入！我是您的 AI 助理 🤖'
        });
    }

    /**
     * 處理取消好友事件
     */
    private async handleUnfollow(event: WebhookEvent): Promise<void> {
        if (event.type !== 'unfollow') return;

        console.log('[MessageHandler] 使用者取消追蹤:', event.source.userId);
    }
}
