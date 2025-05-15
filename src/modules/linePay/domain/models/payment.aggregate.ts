import { Money, OrderId } from './payment.value-objects';
import { PaymentEnum } from '@prisma/client';
import { PaymentEventType } from '../events/payment.events';

export class PaymentAggregate {
  private events: PaymentEventType[] = [];

  private constructor(
    private readonly orderId: OrderId,
    private readonly userId: string,
    private readonly money: Money,
    private status: PaymentEnum
  ) {}

  static create(
    orderId: string,
    userId: string,
    amount: number,
    currency: string = 'TWD'
  ): PaymentAggregate {
    return new PaymentAggregate(
      new OrderId(orderId),
      userId,
      new Money(amount, currency),
      PaymentEnum.PENDING
    );
  }

  confirm(transactionId: string): void {
    if (this.status !== PaymentEnum.PENDING) {
      throw new Error('Payment can only be confirmed when pending');
    }
    this.status = PaymentEnum.SUCCESS;
    this.events.push(PaymentEventType.PAYMENT_CONFIRMED);
  }

  fail(): void {
    if (this.status !== PaymentEnum.PENDING) {
      throw new Error('Payment can only fail when pending');
    }
    this.status = PaymentEnum.FAILED;
    this.events.push(PaymentEventType.PAYMENT_FAILED);
  }

  getUncommittedEvents(): PaymentEventType[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  get currentStatus(): PaymentEnum {
    return this.status;
  }
}