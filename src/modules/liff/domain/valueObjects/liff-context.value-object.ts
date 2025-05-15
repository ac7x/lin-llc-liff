/**
 * LIFF 上下文值對象
 * 封裝 LIFF 上下文資訊
 */
export class LiffContextValueObject {
  constructor(
    private readonly _liffId: string,
    private readonly _type: string,
    private readonly _viewType: string,
    private readonly _userId?: string,
    private readonly _isInClient: boolean = false
  ) {}
  
  get liffId(): string {
    return this._liffId;
  }
  
  get type(): string {
    return this._type;
  }
  
  get viewType(): string {
    return this._viewType;
  }
  
  get userId(): string | undefined {
    return this._userId;
  }
  
  get isInClient(): boolean {
    return this._isInClient;
  }
}
