'use server';

import { getUserAssets } from '@/modules/c-assets/application/assets/user-asset.actions';
import { paymentService } from '@/modules/c-linePay/application/services/payment.service';
import { PaymentEventType } from '@/modules/c-linePay/domain/events/payment.events';
import { PaymentAggregate } from '@/modules/c-linePay/domain/models/payment.aggregate';
import { Money, OrderId } from '@/modules/c-linePay/domain/models/payment.value-objects';
import { PaymentResult } from '@/modules/c-linePay/domain/payment.types';
import { PaymentDomainService } from '@/modules/c-linePay/domain/services/payment.domain.service';
import { v4 as uuidv4 } from 'uuid';

export async function createLinePayRequest(userId: string, amount: number): Promise<string> {
  const returnHost = process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000';
  return paymentService.createPaymentRequest({
    userId,
    amount,
    returnHost
  });
}

export async function getOrderById(orderId: string): Promise<any> {
  return paymentService.getOrderById(orderId);
}

export async function handleLinePayCallback(
  transactionId: string | null,
  orderId: string
): Promise<{ success: boolean; redirectUrl: string }> {
  console.log('handleLinePayCallback started', { transactionId, orderId });
  const domainService = new PaymentDomainService();

  try {
    const result = await paymentService.handlePaymentCallback(transactionId, orderId);

    if (result.success) {
      // 發布支付成功事件
      const payment = await paymentService.getOrderById(orderId);
      const paymentEvent = domainService.createPaymentEvent(
        PaymentEventType.PAYMENT_CONFIRMED,
        new OrderId(orderId),
        payment.userId,
        new Money(payment.amount, 'TWD')
      );
      // TODO: 實現事件發布機制
    }

    console.log('handleLinePayCallback completed successfully', { transactionId, orderId });
    return result;
  } catch (error: any) {
    // 發布支付失敗事件
    const paymentEvent = domainService.createPaymentEvent(
      PaymentEventType.PAYMENT_FAILED,
      new OrderId(orderId),
      'unknown',
      new Money(0, 'TWD')
    );
    // TODO: 實現事件發布機制

    console.error('handleLinePayCallback failed', { transactionId, orderId, error });
    throw error;
  }
}

export async function confirmLinePayment(params: {
  transactionId: string;
  orderId: string;
  amount: number;
  userId: string;
}) {
  return paymentService.confirmPayment(params);
}

export async function initiatePayment(userId: string, amount: number): Promise<PaymentResult> {
  try {
    // 1. 建立值物件
    const money = new Money(amount, 'TWD');
    const orderId = new OrderId(uuidv4());
    const domainService = new PaymentDomainService();

    // 2. 驗證支付
    const isValid = await domainService.validatePayment(money, userId);
    if (!isValid) {
      return { success: false, error: 'Invalid payment amount or daily limit exceeded' };
    }

    // 3. 建立支付聚合根
    const payment = PaymentAggregate.create(
      orderId.toString(),
      userId,
      money.value,
      money.currencyCode
    );

    // 4. 建立支付請求
    const paymentUrl = await createLinePayRequest(userId, money.value);

    return {
      success: true,
      redirectUrl: paymentUrl
    };
  } catch (error: any) {
    console.error('Payment initiation failed:', error);
    return {
      success: false,
      error: error.message || 'Payment request failed. Please try again later.'
    };
  }
}

export async function fetchUserAssets(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return getUserAssets(userId);
}
