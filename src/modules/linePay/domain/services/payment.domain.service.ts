import { Money, OrderId } from '../models/payment.value-objects';
import { PaymentEvent, PaymentEventType } from '../events/payment.events';

export class PaymentDomainService {
  private static readonly DAILY_LIMIT = 50000;
  private static readonly TRANSACTION_LIMIT = 100000;

  async validatePayment(money: Money, userId: string): Promise<boolean> {
    try {
      // 基本驗證
      if (!this.validateAmount(money)) {
        return false;
      }

      // 檢查每日限額
      if (!await this.checkDailyLimit(userId, money.value)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Payment validation failed:', error);
      return false;
    }
  }

  private validateAmount(money: Money): boolean {
    return money.value > 0 && 
           money.value <= PaymentDomainService.TRANSACTION_LIMIT;
  }

  private async checkDailyLimit(userId: string, amount: number): Promise<boolean> {
    // TODO: 實現每日限額檢查邏輯
    // 這裡應該查詢用戶今日已完成的交易總額
    return amount <= PaymentDomainService.DAILY_LIMIT;
  }

  createPaymentEvent(
    type: PaymentEventType,
    orderId: OrderId,
    userId: string,
    money: Money
  ): PaymentEvent {
    return {
      type,
      payload: {
        orderId: orderId.toString(),
        userId,
        amount: money.value,
        timestamp: new Date()
      }
    };
  }
}