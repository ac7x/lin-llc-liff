import { Message } from '@line/bot-sdk';
import { useCallback } from 'react';
import { LineBotAdapter } from '../../infrastructure/adapters/lineBot-adapter';

export const useLineBot = () => {
    const pushMessage = useCallback(async (to: string, messages: Message | Message[]) => {
        const config = LineBotAdapter.getConfig();
        const client = new (await import('@line/bot-sdk')).Client(config);
        await client.pushMessage(to, messages);
    }, []);

    const replyMessage = useCallback(async (replyToken: string, messages: Message | Message[]) => {
        const config = LineBotAdapter.getConfig();
        const client = new (await import('@line/bot-sdk')).Client(config);
        await client.replyMessage(replyToken, messages);
    }, []);

    return { pushMessage, replyMessage };
};
