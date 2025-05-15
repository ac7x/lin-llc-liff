// src/infrastructure/payments/payments.config.ts

// Base URL for LINE Pay API, used to construct all API requests.
export const LINE_PAY_API_URL = 'https://sandbox-api-pay.line.me';

// Environment variables for LINE Pay authentication.
// These are required for all API requests to LINE Pay.
export const LINE_PAY_CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID!;
export const LINE_PAY_CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET!;
