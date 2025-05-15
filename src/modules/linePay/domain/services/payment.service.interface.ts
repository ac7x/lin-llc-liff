import { 
  CreatePaymentParams, 
  ConfirmPaymentParams, 
  PaymentConfirmResult,
  PaymentCallbackResult
} from '../models/payment.model';

/**
 * 支付服務接口
 * 定義支付領域的核心業務邏輯
 */
export interface IPaymentService {
  /**
   * 創建支付請求
   * @param params - 創建支付所需參數
   * @returns 支付URL
   */
  createPaymentRequest(params: CreatePaymentParams): Promise<string>;
  
  /**
   * 獲取訂單信息
   * @param orderId - 訂單ID
   * @returns 訂單詳情或錯誤信息
   */
  getOrderById(orderId: string): Promise<any>;
  
  /**
   * 確認支付
   * @param params - 確認支付所需參數
   * @returns 確認結果
   */
  confirmPayment(params: ConfirmPaymentParams): Promise<PaymentConfirmResult>;
  
  /**
   * 處理支付回調
   * @param transactionId - 交易ID
   * @param orderId - 訂單ID
   * @returns 回調處理結果
   */
  handlePaymentCallback(
    transactionId: string | null, 
    orderId: string
  ): Promise<PaymentCallbackResult>;
}