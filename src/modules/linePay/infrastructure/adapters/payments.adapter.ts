import {
  LINE_PAY_API_URL,
  LINE_PAY_CHANNEL_ID,
} from '@/modules/c-linePay/infrastructure/payment.config';
import axios from 'axios';

import {
  generateNonce,
  generateSignature,
} from '@/modules/c-linePay/infrastructure/payment.utils';

/**
 * LINE Pay 適配器
 * 處理與 LINE Pay API 的直接通信
 */
export class LinePayAdapter {
  /**
   * 發送請求到 LINE Pay API
   * @param uri - API端點路徑
   * @param body - 請求負載
   * @returns LINE Pay API的響應
   */
  async sendRequest(uri: string, body: any) {
    console.log(`[LINE Pay] Request started: ${uri}`);
    console.log(`[LINE Pay] Request body:`, body);

    try {
      const nonce = generateNonce();
      const bodyStr = JSON.stringify(body);
      const bodyObj = JSON.parse(bodyStr);

      if (uri.includes('{') && uri.includes('}')) {
        console.error(`[LINE Pay] Error: URI contains unresolved placeholders: "${uri}"`);
        throw new Error('URI contains unresolved placeholders. Replace them before making the request.');
      }

      const signature = generateSignature(uri, bodyStr, nonce);

      console.log(`[LINE Pay] Sending request: ${uri}`);
      console.log(`[LINE Pay] Request details:`, {
        channelId: LINE_PAY_CHANNEL_ID,
        nonce: nonce,
        url: `${LINE_PAY_API_URL}${uri}`,
        bodyPreview: JSON.stringify(body).substring(0, 100) + '...'
      });

      const response = await axios.post(
        `${LINE_PAY_API_URL}${uri}`,
        bodyObj,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-LINE-ChannelId': LINE_PAY_CHANNEL_ID,
            'X-LINE-Authorization-Nonce': nonce,
            'X-LINE-Authorization': signature,
          }
        }
      );

      const { returnCode, returnMessage } = response.data;
      console.log(`[LINE Pay] Request successful: ${uri}`, {
        returnCode,
        returnMessage,
        transactionId: response.data.info?.transactionId,
        orderId: response.data.info?.orderId
      });

      console.log(`[LINE Pay] Response data:`, response.data);
      console.log(`[LINE Pay] Request completed: ${uri}`);
      return response.data;
    } catch (error: any) {
      console.error('LINE Pay API error:', error.response?.data || error.message);
      if (error.response) {
        console.error('Error status code:', error.response.status);
        console.error('Error details:', error.response.data);
        console.error('Request URI:', uri);
        console.error('Request body:', body);
      }
      throw error;
    }
  }

  /**
   * 創建支付請求
   * @param amount - 金額
   * @param orderId - 訂單ID
   * @param returnHost - 回調主機地址
   * @returns 包含支付URL的響應
   */
  async createPaymentRequest(amount: number, orderId: string, returnHost: string) {
    const requestBody = {
      amount,
      currency: 'TWD',
      orderId,
      packages: [{
        id: 'package-1',
        amount,
        name: 'Diamond Recharge',
        products: [{
          name: `${amount} Diamonds`,
          quantity: 1,
          price: amount
        }]
      }],
      redirectUrls: {
        confirmUrl: `${returnHost}/client/home?orderId=${orderId}`,  // 修改這裡
        cancelUrl: `${returnHost}/client/home?status=error`  // 修改這裡
      }
    };

    return this.sendRequest('/v3/payments/request', requestBody);
  }

  /**
   * 確認支付
   * @param transactionId - 交易ID
   * @param amount - 金額
   * @returns 確認支付的響應
   */
  async confirmPayment(transactionId: string, amount: number) {
    const requestUri = `/v3/payments/${transactionId}/confirm`;
    const requestBody = {
      amount,
      currency: 'TWD'
    };

    console.log(`[LINE Pay] Confirming payment: Transaction ID=${transactionId}, Amount=${amount}`);
    console.log(`[LINE Pay] Using URI: ${requestUri}`);

    return this.sendRequest(requestUri, requestBody);
  }
}

// 導出單例實例
export const linePayAdapter = new LinePayAdapter();
