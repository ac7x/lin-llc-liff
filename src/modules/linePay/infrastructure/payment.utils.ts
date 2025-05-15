// src/infrastructure/payments/payments.utils.ts

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { LINE_PAY_CHANNEL_SECRET } from './payment.config';

export function generateNonce(): string {
  return uuidv4();
}

export function generateSignature(uri: string, body: string | object, nonce: string): string {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const normUri = uri.startsWith('/') ? uri : `/${uri}`;
  
  if (normUri.includes('{') && normUri.includes('}')) {
    throw new Error(`URI contains unresolved placeholders: ${normUri}`);
  }

  const stringToSign = LINE_PAY_CHANNEL_SECRET + normUri + bodyStr + nonce;
  
  console.log('[LINE Pay] Signature generation details:', {
    uri: normUri,
    nonce,
    channelSecret: LINE_PAY_CHANNEL_SECRET.substring(0, 3) + '...',
    bodyLength: bodyStr.length,
    stringToSignLength: stringToSign.length
  });

  return crypto.createHmac('SHA256', LINE_PAY_CHANNEL_SECRET)
    .update(stringToSign)
    .digest('base64');
}
