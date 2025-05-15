'use client';

import { processLinePayCallback } from '@/modules/c-linePay/application/callbacks/payment.callback';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { PaymentEnumMessage } from './payment.status';

export function PaymentCallback() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId') || '';  // 提供空字串作為預設值
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // 只在有 orderId 且 transactionId 不為空字串時處理
    if (orderId && transactionId) {
      processLinePayCallback(transactionId, orderId);
    }
  }, [transactionId, orderId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <PaymentEnumMessage
        status={{
          type: 'pending',
          message: 'Processing your payment. Please wait...'
        }}
      />
    </div>
  );
}

// 其他支付相關組件可以在這裡添加...
