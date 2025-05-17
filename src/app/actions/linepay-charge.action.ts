"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";
import { createHmac } from "crypto";

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
    paymentUrl?: {
        web?: string;
        app?: string;
    };
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

    const signature = createHmac('sha256', secret).update(message).digest('base64');

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
        throw new Error("LINE Pay 設定錯誤：缺少必要的環境變數");
    }

    const orderId = `order_${Date.now()}`;
    const nonce = Date.now().toString();
    const requestUrl = `${API_URL}/v3/payments/request`;

    const requestBody = {
        amount,
        currency: "TWD",
        orderId,
        packages: [{
            id: "pkg_" + orderId,
            amount,
            name: "儲值",
            products: [{
                name: "點數儲值",
                quantity: 1,
                price: amount
            }]
        }],
        redirectUrls: {
            confirmUrl: `${BASE_URL}/linepay/confirm`,
            cancelUrl: `${BASE_URL}/linepay/cancel`
        }
    };

    const headers = {
        "X-LINE-ChannelId": CHANNEL_ID,
        "X-LINE-MerchantDeviceProfileId": "Default",
        "X-LINE-AuthKey": createSignature(
            CHANNEL_SECRET,
            "/v3/payments/request",
            JSON.stringify(requestBody),
            nonce
        ),
        "X-LINE-ChannelSecret": CHANNEL_SECRET,
        "Content-Type": "application/json"
    };

    try {
        logTransactionStatus(orderId, 'REQUEST_SENT', {
            orderId,
            amount,
            currency: "TWD",
            endpoint: requestUrl,
            headers
        });

        const response = await fetch(requestUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        });

        const result = await response.json() as LinePayResponse;

        logTransactionStatus(orderId, 'RESPONSE_RECEIVED', {
            orderId,
            status: response.status,
            returnCode: result.returnCode,
            returnMessage: result.returnMessage
        });

        if (!response.ok || result.returnCode !== "0000") {
            throw new Error(result.returnMessage || "LINE Pay API 回應錯誤");
        }

        // 記錄成功狀態
        logTransactionStatus(orderId, 'SUCCESS', {
            orderId,
            transactionId: result.info?.transactionId,
            paymentUrl: result.info?.paymentUrl
        });

        return {
            paymentUrl: result.info?.paymentUrl?.web || result.info?.paymentUrl?.app,
            transactionId: result.info?.transactionId,
            orderId
        };

    } catch (error) {
        logTransactionStatus(orderId, 'ERROR', {
            orderId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

export async function confirmLinePayCharge(transactionId: string, orderId: string) {
    console.log("[LINE Pay] 開始確認交易:", {
        timestamp: new Date().toISOString(),
        transactionId,
        orderId,
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

    const requestPath = `/v3/payments/${transactionId}/confirm`;
    const requestUrl = `${API_URL}${requestPath}`;
    logTransactionStatus(orderId, 'PREPARING', { transactionId });

    const body = {
        currency: "TWD",
        amount: await getOrderAmount(orderId)
    };

    const nonce = Date.now().toString();
    const bodyString = JSON.stringify(body);
    const signature = createSignature(CHANNEL_SECRET, requestPath, bodyString, nonce);

    try {
        logTransactionStatus(orderId, 'REQUEST_SENT', {
            endpoint: requestUrl,
            transactionId
        });

        const res = await fetch(requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-LINE-ChannelId": CHANNEL_ID,
                "X-LINE-Authorization-Nonce": nonce,
                "X-LINE-Authorization": signature
            },
            body: bodyString
        });

        const data = await res.json();

        if (!res.ok) {
            logTransactionStatus(orderId, 'ERROR', {
                status: res.status,
                message: data
            });
            throw new Error(
                `LINE Pay 確認交易失敗 (狀態碼: ${res.status})\n` +
                `Response: ${JSON.stringify(data)}`
            );
        }

        logTransactionStatus(orderId, 'SUCCESS', {
            returnCode: data.returnCode,
            returnMessage: data.returnMessage,
            transactionId
        });

        // TODO: 更新用戶資產
        await updateUserAssets(orderId, body.amount);

        return data;
    } catch (err) {
        console.error("[LINE Pay] 確認交易異常:", {
            timestamp: new Date().toISOString(),
            orderId,
            transactionId,
            error: err instanceof Error ? err.message : String(err)
        });
        throw new Error(
            `LINE Pay 確認交易異常: ${err instanceof Error ? err.message : String(err)}`
        );
    }
}

// 從訂單 ID 取得交易金額
async function getOrderAmount(orderId: string): Promise<number> {
    try {
        // 從 Firestore 查詢訂單
        const orderDoc = await firestoreAdmin.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            console.error('[LINE Pay] 找不到訂單:', {
                timestamp: new Date().toISOString(),
                orderId
            });
            throw new Error('找不到訂單資訊');
        }

        const orderData = orderDoc.data();
        if (!orderData?.amount) {
            console.error('[LINE Pay] 訂單金額無效:', {
                timestamp: new Date().toISOString(),
                orderId,
                orderData
            });
            throw new Error('訂單金額無效');
        }

        return orderData.amount;
    } catch (err) {
        console.error('[LINE Pay] 取得訂單金額失敗:', {
            timestamp: new Date().toISOString(),
            orderId,
            error: err instanceof Error ? err.message : String(err)
        });
        throw new Error(`取得訂單金額失敗: ${err instanceof Error ? err.message : String(err)}`);
    }
}

// 更新用戶資產
async function updateUserAssets(orderId: string, amount: number): Promise<void> {
    // TODO: 實作用戶資產更新邏輯
    console.log("[LINE Pay] 更新用戶資產:", {
        timestamp: new Date().toISOString(),
        orderId,
        amount
    });
}
