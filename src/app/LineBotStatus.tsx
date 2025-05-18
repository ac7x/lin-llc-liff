"use client"

import { getLineBotStatus } from "@/modules/lineBot/infrastructure/linebot.action";
import { useState, useTransition } from "react";

// 假設未來可呼叫 API 取得 bot 狀態或發送訊息
export function LineBotStatus() {
    const [status, setStatus] = useState<string>("尚未查詢");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<string>("");
    const [, startTransition] = useTransition();

    // 範例：呼叫一個 API 取得 bot 狀態
    const checkBotStatus = async () => {
        setLoading(true);
        setError(null);
        setServerStatus("");
        try {
            startTransition(async () => {
                const res = await getLineBotStatus();
                if (res.ok) {
                    setStatus("Bot 運作正常");
                    setServerStatus(
                        Object.entries(res)
                            .filter(([key]) => key !== 'ok')
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('\n')
                    );
                } else {
                    setStatus("Bot 狀態異常");
                    setError(res.error || "未知錯誤");
                }
                setLoading(false);
            });
        } catch {
            setError("查詢失敗");
            setLoading(false);
        }
    };

    return (
        <div className="my-4 p-3 bg-lime-100 rounded">
            <div className="font-bold mb-2">LINE Bot 狀態檢查</div>
            <button
                onClick={checkBotStatus}
                className="bg-lime-600 hover:bg-lime-700 text-white px-3 py-1 rounded"
                disabled={loading}
            >
                {loading ? "查詢中..." : "檢查 Bot 狀態"}
            </button>
            <div className="mt-2 text-sm">
                狀態：<span className="font-mono">{status}</span>
                {serverStatus && (
                    <pre className="bg-white text-xs mt-2 p-2 rounded border border-lime-200 whitespace-pre-wrap">{serverStatus}</pre>
                )}
            </div>
            {error && <div className="text-red-600">{error}</div>}
        </div>
    );
}
