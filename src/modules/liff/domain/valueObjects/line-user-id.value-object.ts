/**
 * LINE 用戶 ID 值對象
 * 封裝 LINE 用戶 ID 的驗證與行為
 */
export class LineUserIdValueObject {
  constructor(private readonly _value: string) {
    this.validate();
  }
  
  private validate(): void {
    if (!this._value || this._value.trim() === '') {
      throw new Error('LINE User ID cannot be empty');
    }
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: LineUserIdValueObject): boolean {
    return this._value === other._value;
  }
}
