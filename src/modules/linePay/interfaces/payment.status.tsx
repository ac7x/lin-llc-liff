'use client';

import { PaymentEnum } from '@/modules/c-linePay/domain/payment.types';

interface PaymentEnumMessageProps {
  status: PaymentEnum;
}

export function PaymentEnumMessage({ status }: PaymentEnumMessageProps) {
  if (!status.type) return null;

  const backgroundClass =
    status.type === 'success' ? 'bg-green-100 text-green-800' :
      status.type === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800';

  return (
    <div className={`mb-4 p-4 rounded-md ${backgroundClass}`}>
      {status.message}
    </div>
  );
}
