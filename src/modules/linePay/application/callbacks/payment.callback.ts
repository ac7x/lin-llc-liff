import { safeRedirect } from '@/modules/c-linePay/infrastructure/payment.signature';
import { handleLinePayCallback } from '../actions/payment.actions';

export async function processLinePayCallback(transactionId: string, orderId: string) {
  console.log('LINE Pay callback received:', { transactionId, orderId });

  if (!orderId) {
    console.error('Missing orderId parameter');
    return safeRedirect('/client/home?status=error&reason=missing_order_id');
  }

  console.log('Processing LINE Pay callback:', { transactionId, orderId });
  const result = await handleLinePayCallback(transactionId, orderId);
  console.log('LINE Pay callback processed:', { transactionId, orderId });

  if (!result || !result.redirectUrl) {
    return safeRedirect('/client/home?status=error&reason=unknown');
  }

  const redirectUrl = result.redirectUrl.replace('/success', '/client/home');
  console.log(`Redirecting to: ${redirectUrl}`);
  return safeRedirect(redirectUrl);
}
