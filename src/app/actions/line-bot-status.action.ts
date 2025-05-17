"use server";
// TODO: @line/bot-sdk 的 Client 已標示為 deprecated，官方建議改用 openapi client，待官方 openapi client 普及後再替換
import { Client } from '@line/bot-sdk';

// 你可以將這些資訊放到環境變數
const client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    channelSecret: process.env.LINE_CHANNEL_SECRET!,
});

export async function getLineBotStatus() {
    try {
        // 取得 bot 的個人資料作為健康檢查
        // 這裡用 PUBLIC_LINE_BOT_ID 代表 bot userId
        const botUserId = process.env.PUBLIC_LINE_BOT_ID;
        if (!botUserId) throw new Error('缺少 PUBLIC_LINE_BOT_ID');
        // LINE Bot API 不需要 "@" 前綴
        const profile = await client.getProfile(botUserId);
        return {
            ok: true,
            displayName: profile.displayName,
            userId: profile.userId,
            statusMessage: profile.statusMessage,
            pictureUrl: profile.pictureUrl,
        };
    } catch (err) {
        console.error('[LINE Bot] 取得狀態失敗:', {
            error: err instanceof Error ? err.message : String(err),
            botUserId: process.env.PUBLIC_LINE_BOT_ID
        });
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
