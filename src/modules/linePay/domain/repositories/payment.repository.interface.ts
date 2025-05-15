import { PaymentEnum } from '@prisma/client';
import { PaymentEntity, PaymentTransaction } from '../models/payment.model';

/**
 * 支付倉庫接口
 * 定義支付資料的持久化操作
 */
export interface IPaymentRepository {
  /**
   * 創建支付交易記錄
   * @param transaction - 交易數據
   * @returns 創建的交易記錄
   */
  createTransaction(transaction: PaymentTransaction): Promise<PaymentTransaction>;
  
  /**
   * 根據訂單ID查詢交易
   * @param orderId - 訂單ID
   * @returns 交易記錄或null
   */
  getTransactionByOrderId(orderId: string): Promise<{ 
    userId: string; 
    amount: number; 
    status: PaymentEnum;
    user: { userId: string };
  } | null>;
  
  /**
   * 更新交易狀態
   * @param orderId - 訂單ID
   * @param status - 新狀態
   * @param transactionId - 交易ID
   * @returns 更新的交易記錄
   */
  updateTransactionStatus(
    orderId: string, 
    status: PaymentEnum, 
    transactionId?: string
  ): Promise<void>;

  create(payment: Omit<PaymentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentEntity>;
  findByOrderId(orderId: string): Promise<PaymentEntity | null>;
  updateStatus(orderId: string, status: PaymentEnum, transactionId?: string): Promise<PaymentEntity>;
}