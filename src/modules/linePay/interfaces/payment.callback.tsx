'use client';

import { processLinePayCallback } from '@/modules/c-linePay/application/callbacks/payment.callback';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function PaymentCallback() {
  const searchParams = useSearchParams();

  // 處理 LINE Pay 回調
  useEffect(() => {
    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');

    if (orderId && transactionId) {
      processLinePayCallback(transactionId, orderId);
    }
  }, [searchParams]);

  return null;
}
