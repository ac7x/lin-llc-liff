import {
  ConfirmPaymentParams,
  CreatePaymentParams,
  PaymentCallbackResult,
  PaymentConfirmResult
} from '@/modules/c-linePay/domain/models/payment.model';
import { IPaymentService } from '@/modules/c-linePay/domain/services/payment.service.interface';
import { linePayAdapter } from '@/modules/c-linePay/infrastructure/adapters/payments.adapter';
import { paymentRepository } from '@/modules/c-linePay/infrastructure/repositories/payment.repository';
import { prisma } from '@/modules/c-shared/infrastructure/persistence/prisma/client';
import { PaymentEnum } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * 支付服務實現
 * 處理支付相關的業務邏輯
 */
export class PaymentService implements IPaymentService {
  /**
   * 創建支付請求
   * @param params - 創建支付所需參數
   * @returns 支付URL
   */
  async createPaymentRequest(params: CreatePaymentParams): Promise<string> {
    try {
      const { userId, amount, returnHost } = params;
      const orderId = uuidv4();

      // 確保用戶存在並獲取完整用戶資訊
      const user = await prisma.user.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true  // 同時獲取 userId 以確保用戶存在
        }
      });

      if (!user) {
        throw new Error(`User not found: userId=${userId}`);
      }

      const response = await linePayAdapter.createPaymentRequest(amount, orderId, returnHost);

      if (response.returnCode === '0000') {
        // 確保創建交易時使用正確的用戶 ID
        await paymentRepository.createTransaction({
          userId: user.id,
          orderId,
          amount,
          currency: 'TWD',
          status: PaymentEnum.PENDING,
          packages: response.info.packages || [],
          paymentUrl: response.info.paymentUrl || {},
          redirectUrls: {
            confirmUrl: `${returnHost}/client/exchange?orderId=${orderId}`,
            cancelUrl: `${returnHost}/client/exchange?status=error`
          }
        });

        return response.info.paymentUrl.web;
      } else {
        console.error('LINE Pay Error:', response);
        throw new Error(`Payment request failed: ${response.returnMessage}`);
      }
    } catch (error: any) {
      console.error('Payment request failed:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * 獲取訂單信息
   * @param orderId - 訂單ID
   * @returns 訂單詳情或錯誤信息
   */
  async getOrderById(orderId: string): Promise<any> {
    try {
      const payment = await paymentRepository.getTransactionByOrderId(orderId);

      if (!payment) {
        return { error: 'Order not found', status: 404 };
      }

      return payment;
    } catch (error) {
      console.error('Error fetching order:', error);
      return { error: 'Internal server error', status: 500 };
    }
  }

  /**
   * 確認支付
   * @param params - 確認支付所需參數
   * @returns 確認結果
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentConfirmResult> {
    const { transactionId, orderId, amount, userId } = params;

    try {
      if (!transactionId || transactionId === '{transactionId}') {
        console.error('Invalid transaction ID:', transactionId);
        throw new Error('Invalid transaction ID');
      }

      const response = await linePayAdapter.confirmPayment(transactionId, amount);

      if (response.returnCode === '0000') {
        const confirmedTransactionId = response.info.transactionId.toString();

        const user = await prisma.user.findUnique({
          where: { userId },
          select: { id: true }
        });

        if (!user) {
          console.error(`User not found: userId=${userId}`);
          throw new Error(`User not found: userId=${userId}`);
        }

        // 使用交易確保支付和資產變動的一致性
        await prisma.$transaction(async (tx) => {
          // 1. 更新支付狀態
          await paymentRepository.updateTransactionStatus(
            orderId,
            PaymentEnum.SUCCESS,
            confirmedTransactionId
          );

          // 2. 處理資產變動
          await paymentRepository.handleSuccessfulPayment(user.id, amount);
        });

        return { success: true };
      }

      throw new Error(response.returnMessage);
    } catch (error: any) {
      console.error('Payment confirmation failed:', error.response?.data || error);
      return {
        success: false,
        error: error.message || 'Payment confirmation failed'
      };
    }
  }

  /**
   * 處理支付回調
   * @param transactionId - 交易ID
   * @param orderId - 訂單ID
   * @returns 回調處理結果
   */
  async handlePaymentCallback(
    transactionId: string | null,
    orderId: string
  ): Promise<PaymentCallbackResult> {
    try {
      const payment = await paymentRepository.getTransactionByOrderId(orderId);

      if (!payment) {
        console.error('Order not found:', orderId);
        return {
          success: false,
          redirectUrl: '/client/exchange?status=error&reason=not_found'
        };
      }

      if (payment.status === PaymentEnum.SUCCESS) {
        console.log('Order already processed successfully:', orderId);
        return {
          success: true,
          redirectUrl: `/client/exchange?status=success&amount=${payment.amount}`
        };
      }

      if (!transactionId) {
        console.log('Missing transaction ID parameter, redirecting to pending status');
        return {
          success: false,
          redirectUrl: '/client/exchange?status=pending&reason=verification_needed&orderId=' + encodeURIComponent(orderId)
        };
      }

      try {
        // 嘗試確認支付
        const result = await this.confirmPayment({
          transactionId: transactionId,
          orderId,
          amount: payment.amount,
          userId: payment.user.userId
        });

        if (result.success) {
          return {
            success: true,
            redirectUrl: `/client/exchange?status=success&amount=${payment.amount}`
          };
        } else {
          const errorMsg = encodeURIComponent(result.error || 'Unknown error during confirmation');
          return {
            success: false,
            redirectUrl: `/client/exchange?status=error&reason=confirm_failed&message=${errorMsg}`
          };
        }
      } catch (payError: any) {
        console.error('支付確認過程中發生錯誤:', payError);
        // 捕獲詳細的錯誤訊息
        let errorDetails = '';
        if (payError instanceof Error) {
          errorDetails = payError.stack
            ? `${payError.message}\n${payError.stack}`
            : payError.message;
        }
        console.error('詳細錯誤:', errorDetails);

        // 編碼更詳細的錯誤訊息
        const errorMsg = encodeURIComponent(
          payError.message || 'Payment confirmation failed'
        );

        return {
          success: false,
          redirectUrl: `/client/exchange?status=error&reason=confirm_error&message=${errorMsg}`
        };
      }
    } catch (error: any) {
      console.error('處理 LINE Pay 回調時發生錯誤:', error);
      const errorMessage = encodeURIComponent(error.message || 'Unknown error');
      return {
        success: false,
        redirectUrl: `/client/exchange?status=error&reason=server_error&message=${errorMessage}`
      };
    }
  }
}

// 導出單例實例
export const paymentService = new PaymentService();
