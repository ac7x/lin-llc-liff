import { PaymentRequestDTO, PaymentResponseDTO } from '@/modules/c-linePay/domain/models/payment.model';
import {
  LINE_PAY_API_URL,
  LINE_PAY_CHANNEL_ID,
} from '@/modules/c-linePay/infrastructure/payment.config';
import { generateNonce, generateSignature } from '@/modules/c-linePay/infrastructure/payment.utils';
import axios from 'axios';

export class LinePayService {
  async sendRequest(uri: string, body: any): Promise<PaymentResponseDTO> {
    try {
      const nonce = generateNonce(); // Generate a unique nonce to prevent replay attacks.

      const bodyStr = JSON.stringify(body); // Serialize the request body to a JSON string.
      const bodyObj = JSON.parse(bodyStr); // Parse back to ensure consistency.

      // Validate that the URI does not contain unresolved placeholders.
      if (uri.includes('{') && uri.includes('}')) {
        console.error(`[LINE Pay] Error: URI contains unresolved placeholders: "${uri}"`);
        throw new Error('URI contains unresolved placeholders. Replace them before making the request.');
      }

      // Generate a signature to ensure the integrity of the request.
      const signature = generateSignature(uri, bodyStr, nonce);

      // Log request details for debugging purposes.
      console.log(`[LINE Pay] Sending request: ${uri}`);
      console.log(`[LINE Pay] Request details:`, {
        channelId: LINE_PAY_CHANNEL_ID,
        nonce: nonce,
        url: `${LINE_PAY_API_URL}${uri}`,
        bodyPreview: JSON.stringify(body).substring(0, 100) + '...'
      });

      // Send the POST request to the LINE Pay API.
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

      // Log key details from the API response.
      const { returnCode, returnMessage } = response.data;
      console.log(`[LINE Pay] Request successful: ${uri}`, {
        returnCode,
        returnMessage,
        transactionId: response.data.info?.transactionId,
        orderId: response.data.info?.orderId
      });

      return response.data;
    } catch (error: any) {
      // Log detailed error information for debugging.
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

  async requestPayment(paymentRequest: PaymentRequestDTO): Promise<PaymentResponseDTO> {
    const uri = '/v3/payments/request';
    return this.sendRequest(uri, paymentRequest);
  }

  async confirmPayment(transactionId: string, amount: number, currency: string): Promise<PaymentResponseDTO> {
    const uri = `/v3/payments/${transactionId}/confirm`;
    const requestBody = { amount, currency };
    return this.sendRequest(uri, requestBody);
  }
}

export const linePayService = new LinePayService();