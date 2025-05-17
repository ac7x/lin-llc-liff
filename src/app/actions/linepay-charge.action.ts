"use server";
import crypto from 'crypto';

const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID;
const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET;
const API_URL = process.env.LINE_PAY_API_URL || "https://sandbox-api-pay.line.me";
const BASE_URL = process.env.BASE_URL || "https://lin-llc-liff--lin-llc-liff.asia-east1.hosted.app";

// 交易狀態類型
type TransactionStatus = 'PREPARING' | 'REQUEST_SENT' | 'RESPONSE_RECEIVED' | 'ERROR' | 'SUCCESS';

// 交易日誌細節型別
interface TransactionLogDetails {
    timestamp?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    status?: number;
    endpoint?: string;
    headers?: {
        [key: string]: string | undefined;  // 允許標頭值為 undefined
    };
    error?: string;
    returnCode?: string;
    returnMessage?: string;
    transactionId?: string;
    message?: string | unknown;  // 用於錯誤訊息
    data?: unknown;  // 用於記錄其他未定義的資料
}

interface LinePayResponse {
    returnCode?: string;
    returnMessage?: string;
    info?: {
        paymentUrl?: {
            web?: string;
            app?: string;
        };
        transactionId?: string;
        paymentAccessToken?: string;
    };
}

// 記錄交易狀態的功能
function logTransactionStatus(orderId: string, status: TransactionStatus, details?: TransactionLogDetails) {
    console.log(`[LINE Pay] 交易狀態更新 - ${orderId}:`, {
        timestamp: new Date().toISOString(),
        status,
        details: details ? JSON.stringify(details) : undefined
    });
}

function createSignature(secret: string, requestUrl: string, body: string, nonce: string): string {
    // LINE Pay API 要求的簽章格式為: ${channelSecret}${requestUrl}${requestBody}${nonce}
    const message = secret + requestUrl + body + nonce;

    console.log("[LINE Pay] 準備計算簽章:", {
        timestamp: new Date().toISOString(),
        nonceTimestamp: nonce,
        bodyLength: body.length,
        // 不記錄敏感資訊，但保留 URL 資訊供偵錯
        requestUrl,
        headerPreview: body.slice(0, 50) + "..."
    });

    const signature = crypto.createHmac('sha256', secret).update(message).digest('base64');

    console.log("[LINE Pay] 簽章計算完成:", {
        timestamp: new Date().toISOString(),
        signatureLength: signature.length,
        // 用於偵錯的訊息樣本（不含敏感資訊）
        messageSample: message.replace(secret, "[SECRET]").slice(0, 50) + "..."
    });

    return signature;
}

export async function createLinePayCharge(amount: number) {
    console.log("[LINE Pay] 開始建立儲值請求:", {
        timestamp: new Date().toISOString(),
        amount,
        environment: API_URL.includes('sandbox') ? 'sandbox' : 'production'
    });

    if (!CHANNEL_ID || !CHANNEL_SECRET) {
        console.error("[LINE Pay] 環境變數缺失:", {
            timestamp: new Date().toISOString(),
            hasChannelId: !!CHANNEL_ID,
            hasChannelSecret: !!CHANNEL_SECRET
        });
        throw new Error("LINE Pay 環境變數未設定");
    }

    const orderId = `order_${Date.now()}`;
    const requestPath = '/v3/payments/request'; // 修正: 只取 path
    const requestUrl = `${API_URL}${requestPath}`;
    logTransactionStatus(orderId, 'PREPARING');

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

    console.log("[LINE Pay] 請求內容準備完成:", {
        timestamp: new Date().toISOString(),
        orderId,
        amount,
        currency: body.currency,
        confirmUrl: body.redirectUrls.confirmUrl,
        cancelUrl: body.redirectUrls.cancelUrl
    });

    const nonce = Date.now().toString();
    const bodyString = JSON.stringify(body);
    // 修正: 傳入 path 給 createSignature
    const signature = createSignature(CHANNEL_SECRET, requestPath, bodyString, nonce);

    let res: Response | undefined;
    let data: LinePayResponse | string | null = null;

    try {
        logTransactionStatus(orderId, 'REQUEST_SENT', {
            endpoint: requestUrl,
            headers: {
                "X-LINE-ChannelId": CHANNEL_ID,
                "X-LINE-Authorization-Nonce": nonce,
                // 不記錄實際簽章
                "X-LINE-Authorization": "********"
            }
        });

        res = await fetch(requestUrl, {
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

        logTransactionStatus(orderId, 'RESPONSE_RECEIVED', {
            status: res.status,
            headers: {
                ...headers,
                // 過濾掉可能的敏感標頭
                authorization: undefined,
                cookie: undefined
            }
        });

        try {
            data = JSON.parse(text);
            console.log("[LINE Pay] 回應解析成功:", {
                timestamp: new Date().toISOString(),
                orderId,
                returnCode: (data as LinePayResponse).returnCode,
                returnMessage: (data as LinePayResponse).returnMessage,
                hasPaymentUrl: !!(data as LinePayResponse).info?.paymentUrl?.web
            });
        } catch (parseError) {
            console.error("[LINE Pay] 回應解析失敗:", {
                timestamp: new Date().toISOString(),
                orderId,
                error: parseError instanceof Error ? parseError.message : String(parseError),
                responseText: text.slice(0, 100) + "..."
            });
            data = text;
        }

        if (!res.ok) {
            logTransactionStatus(orderId, 'ERROR', {
                status: res.status,
                message: data
            });
            throw new Error(
                `LINE Pay 請求失敗 (狀態碼: ${res.status})\n` +
                `Response: ${typeof data === "object" ? JSON.stringify(data) : data}`
            );
        }

        if (typeof data !== 'object' || data === null || !data.info?.paymentUrl?.web) {
            logTransactionStatus(orderId, 'ERROR', {
                error: 'Invalid response format',
                data
            });
            throw new Error('LINE Pay 回傳格式錯誤');
        }

        logTransactionStatus(orderId, 'SUCCESS', {
            returnCode: data.returnCode,
            returnMessage: data.returnMessage,
            transactionId: data.info.transactionId
        });

        return { paymentUrl: data.info.paymentUrl.web };
    } catch (err) {
        console.error("[LINE Pay] 處理異常:", {
            timestamp: new Date().toISOString(),
            orderId,
            error: err instanceof Error ? err.message : String(err),
            status: res?.status,
            response: data
        });
        throw new Error(
            `LINE Pay 請求異常: ${(err instanceof Error ? err.message : String(err))}`
        );
    }
}
