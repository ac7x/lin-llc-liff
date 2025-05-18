"use server";
// TODO: 待官方 openapi client 普及後替換
import { Client } from '@line/bot-sdk';

const client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    channelSecret: process.env.LINE_CHANNEL_SECRET!,
});

export async function getLineBotStatus() {
    try {
        const botInfo = await client.getBotInfo();
        return {
            ok: true,
            ...botInfo
        };
    } catch (err) {
        console.error('[LINE Bot] 取得狀態失敗:', err);
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}
