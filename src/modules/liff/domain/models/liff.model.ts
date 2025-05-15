// src/modules/liff/domain/models/liff.model.ts
import liff from "@line/liff";

/**
 * LIFF 狀態值物件
 * 表示 LIFF SDK 的狀態
 */
export class LiffStateValueObject {
    constructor(
        private readonly _isInitialized: boolean,
        private readonly _error: string | null
    ) { }

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    get error(): string | null {
        return this._error;
    }

    get hasError(): boolean {
        return this._error !== null;
    }

    public static createInitialized(): LiffStateValueObject {
        return new LiffStateValueObject(true, null);
    }

    public static createError(error: string): LiffStateValueObject {
        return new LiffStateValueObject(false, error);
    }

    public static createUninitialized(): LiffStateValueObject {
        return new LiffStateValueObject(false, null);
    }
}

/**
 * LIFF 實體介面
 * 定義 LIFF SDK 的行為契約
 */
export interface ILiffEntity {
    readonly liffObject: typeof liff | null;
    readonly state: LiffStateValueObject;
}

/**
 * LIFF 實體
 * 封裝 LIFF SDK 的實例和狀態
 */
export class LiffEntity implements ILiffEntity {
    private _liffObject: typeof liff | null = null;
    private _state: LiffStateValueObject;

    private constructor(liffObject: typeof liff | null, state: LiffStateValueObject) {
        this._liffObject = liffObject;
        this._state = state;
    }

    get liffObject(): typeof liff | null {
        return this._liffObject;
    }

    get state(): LiffStateValueObject {
        return this._state;
    }

    public static createUninitialized(): LiffEntity {
        return new LiffEntity(null, LiffStateValueObject.createUninitialized());
    }

    public static createInitialized(liffObject: typeof liff): LiffEntity {
        return new LiffEntity(liffObject, LiffStateValueObject.createInitialized());
    }

    public static createError(error: string): LiffEntity {
        return new LiffEntity(null, LiffStateValueObject.createError(error));
    }
}
