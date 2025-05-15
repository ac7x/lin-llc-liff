import { PaymentEnum } from '@prisma/client';

export interface PaymentEntity {
  id: string;
  userId: string;
  transactionId?: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentEnum;
  packages: any;
  paymentUrl?: any;
  redirectUrls?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRequestDTO {
  amount: number;
  currency: string;
  orderId: string;
  packages: {
    id: string;
    amount: number;
    name: string;
    products: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }[];
  redirectUrls: {
    confirmUrl: string;
    cancelUrl: string;
  };
}

export interface PaymentResponseDTO {
  returnCode: string;
  returnMessage: string;
  info?: {
    transactionId?: string;
    orderId?: string;
    paymentUrl?: {
      web?: string;
      app?: string;
    };
  };
}

export interface PaymentConfirmDTO {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface PaymentCallbackResult {
  success: boolean;
  redirectUrl: string;
}

/**
 * 支付交易模型
 * 表示系統中的支付交易記錄
 */
export interface PaymentTransaction {
  transactionId?: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentEnum;
  packages: any[];
  redirectUrls?: {
    confirmUrl: string;
    cancelUrl: string;
  };
  paymentUrl?: {
    web?: string;
    app?: string;
  };
}

/**
 * 支付創建參數
 */
export interface CreatePaymentParams {
  userId: string;
  amount: number;
  returnHost: string;
}

/**
 * 支付確認參數
 */
export interface ConfirmPaymentParams {
  transactionId: string;
  orderId: string;
  amount: number;
  userId: string;
}

/**
 * 支付確認結果
 */
export interface PaymentConfirmResult {
  success: boolean;
  error?: string;
}