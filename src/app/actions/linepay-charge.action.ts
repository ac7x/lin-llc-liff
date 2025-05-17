"use server";
import crypto from 'crypto';

const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID;
const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET;
const API_URL = process.env.LINE_PAY_API_URL || "https://sandbox-api-pay.line.me";
const BASE_URL = process.env.BASE_URL || "https://lin-llc-liff--lin-llc-liff.asia-east1.hosted.app";

interface LinePayResponse {
    returnCode?: string;
    returnMessage?: string;
    info?: {
        paymentUrl?: {
            web?: string;
        };
    };
}

function createSignature(secret: string, body: string, nonce: string): string {
    const message = secret + body + nonce;
    const signature = crypto.createHmac('sha256', secret).update(message).digest('base64');

    // 記錄簽章計算過程（注意不要顯示完整的敏感資訊）
    console.log("[LINE Pay] 簽章計算:", {
        bodyPreview: body.slice(0, 50) + "...",
        nonceLength: nonce.length,
        signatureLength: signature.length,
        // 用於偵錯的訊息樣本（不含敏感資訊）
        messageSample: message.replace(secret, "[SECRET]").slice(0, 50) + "..."
    });

    return signature;
}

export async function createLinePayCharge(amount: number) {
    if (!CHANNEL_ID || !CHANNEL_SECRET) throw new Error("LINE Pay 環境變數未設定");

    const orderId = `order_${Date.now()}`;
    const body = {
        amount,
        currency: "TWD",
        orderId,
        packages: [
            {
                id: "package-1",
                amount,
                name: "儲值",
                products: [
                    { name: "LINE Pay 儲值", quantity: 1, price: amount }
                ]
            }
        ],
        redirectUrls: {
            confirmUrl: `${BASE_URL}/linepay/confirm`,
            cancelUrl: `${BASE_URL}/linepay/cancel`
        }
    };

    const nonce = Date.now().toString();
    const bodyString = JSON.stringify(body);
    const signature = createSignature(CHANNEL_SECRET, bodyString, nonce);

    let res: Response | undefined;
    let data: LinePayResponse | string | null = null;

    try {
        // 記錄請求詳細資訊
        console.log("[LINE Pay] 請求資訊:", {
            url: `${API_URL}/v3/payments/request`,
            headers: {
                "Content-Type": "application/json",
                "X-LINE-ChannelId": CHANNEL_ID,
                "X-LINE-Authorization-Nonce": nonce,
                "X-LINE-Authorization": signature
            },
            body: JSON.parse(bodyString), // 使用 parse 以獲得格式化的輸出
            signatureInfo: {
                nonce,
                channelSecret: CHANNEL_SECRET?.slice(0, 5) + "...", // 只顯示前 5 位
                message: `${CHANNEL_SECRET}${bodyString}${nonce}`.slice(0, 50) + "..." // 顯示簽章計算的部分訊息
            }
        });

        res = await fetch(`${API_URL}/v3/payments/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-LINE-ChannelId": CHANNEL_ID,
                "X-LINE-Authorization-Nonce": nonce,
                "X-LINE-Authorization": signature
            },
            body: bodyString
        });

        const text = await res.text();
        const headers = Object.fromEntries(res.headers.entries());

        console.log("[LINE Pay] 回應標頭:", {
            status: res.status,
            headers
        });

        try {
            data = JSON.parse(text);
            console.log("[LINE Pay] 回應內容 (JSON):", data);
        } catch (parseError) {
            data = text;
            console.log("[LINE Pay] 回應內容 (Text):", {
                text,
                parseError: parseError instanceof Error ? parseError.message : String(parseError)
            });
        }

        // 檢查回應格式
        if (typeof data === "object" && data !== null) {
            console.log("[LINE Pay] 回應解析:", {
                returnCode: data.returnCode,
                returnMessage: data.returnMessage,
                info: data.info
            });
        }

        if (!res.ok) {
            throw new Error(
                `LINE Pay 請求失敗 (狀態碼: ${res.status})\n` +
                `Response: ${typeof data === "object" ? JSON.stringify(data) : data}`
            );
        }

        if (typeof data !== 'object' || data === null || !data.info?.paymentUrl?.web) {
            throw new Error('LINE Pay 回傳格式錯誤');
        }

        return { paymentUrl: data.info.paymentUrl.web };
    } catch (err) {
        console.error("[LINE Pay] 請求異常", {
            error: err instanceof Error ? err.message : String(err),
            status: res?.status,
            responseBody: data,
            requestPayload: body
        });
        throw new Error(
            `LINE Pay 請求異常: ${(err instanceof Error ? err.message : String(err))}`
        );
    }
}
