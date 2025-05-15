export class Money {
  private static readonly MINIMUM_AMOUNT = 1;
  private static readonly MAXIMUM_AMOUNT = 100000;
  
  constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {
    if (amount < Money.MINIMUM_AMOUNT) {
      throw new Error(`Amount cannot be less than ${Money.MINIMUM_AMOUNT}`);
    }
    if (amount > Money.MAXIMUM_AMOUNT) {
      throw new Error(`Amount cannot exceed ${Money.MAXIMUM_AMOUNT}`);
    }
    if (!['TWD'].includes(currency)) {
      throw new Error('Unsupported currency');
    }
  }

  get value(): number {
    return this.amount;
  }

  get currencyCode(): string {
    return this.currency;
  }
}

export class OrderId {
  constructor(private readonly value: string) {
    if (!value) throw new Error('OrderId cannot be empty');
  }

  toString(): string {
    return this.value;
  }
}