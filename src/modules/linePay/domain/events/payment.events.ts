export enum PaymentEventType {
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_CONFIRMED = 'payment.confirmed',
  PAYMENT_FAILED = 'payment.failed'
}

export interface PaymentEvent {
  type: PaymentEventType;
  payload: {
    orderId: string;
    userId: string;
    amount: number;
    timestamp: Date;
  };
}

export class PaymentEventPublisher {
  private static handlers: Map<PaymentEventType, Function[]> = new Map();

  static subscribe(eventType: PaymentEventType, handler: Function) {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  static async publish(event: PaymentEvent) {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(handler => handler(event)));
  }
}