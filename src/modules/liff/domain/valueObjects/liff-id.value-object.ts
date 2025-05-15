/**
 * LIFF ID 值對象
 * 封裝 LIFF ID 的驗證與行為
 */
export class LiffIdValueObject {
  // 直接硬編碼 LIFF ID，簡化代碼
  private static readonly HARDCODED_LIFF_ID = '2007169737-PmkARBMK';
  
  constructor(private readonly _value: string = LiffIdValueObject.HARDCODED_LIFF_ID) {
    this.validate();
  }
  
  private validate(): void {
    if (!this._value || this._value.trim() === '') {
      throw new Error('LIFF ID cannot be empty');
    }
  }
  
  get value(): string {
    return this._value;
  }
  
  // 使用靜態方法提供硬編碼的 LIFF ID
  static getDefaultLiffId(): LiffIdValueObject {
    return new LiffIdValueObject(this.HARDCODED_LIFF_ID);
  }
  
  equals(other: LiffIdValueObject): boolean {
    return this._value === other._value;
  }
}
