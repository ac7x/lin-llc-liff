import { LiffIdValueObject, LineUserIdValueObject } from '../valueObjects/liff-id.value-object';

/**
 * LIFF 用戶實體
 * 封裝與 LIFF 用戶相關的屬性與業務邏輯
 */
export class LiffUserEntity {
  private _id: LineUserIdValueObject;
  private _displayName: string;
  private _pictureUrl?: string;
  private _email?: string;
  private _isLoggedIn: boolean = false;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: {
    id: LineUserIdValueObject;
    displayName: string;
    pictureUrl?: string;
    email?: string;
    isLoggedIn?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._displayName = props.displayName;
    this._pictureUrl = props.pictureUrl;
    this._email = props.email;
    this._isLoggedIn = props.isLoggedIn || false;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  /**
   * 創建新的 LIFF 用戶實體
   */
  public static create(props: {
    id: LineUserIdValueObject;
    displayName: string;
    pictureUrl?: string;
    email?: string;
    isLoggedIn?: boolean;
  }): LiffUserEntity {
    return new LiffUserEntity(props);
  }

  /**
   * 從儲存數據重構用戶實體
   */
  public static reconstitute(props: {
    id: LineUserIdValueObject;
    displayName: string;
    pictureUrl?: string;
    email?: string;
    isLoggedIn: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): LiffUserEntity {
    return new LiffUserEntity(props);
  }

  /**
   * 設置用戶登入狀態
   */
  public login(): void {
    this._isLoggedIn = true;
    this._updatedAt = new Date();
  }

  /**
   * 設置用戶登出狀態
   */
  public logout(): void {
    this._isLoggedIn = false;
    this._updatedAt = new Date();
  }

  /**
   * 更新用戶資料
   */
  public updateProfile(props: {
    displayName?: string;
    pictureUrl?: string;
    email?: string;
  }): void {
    if (props.displayName) this._displayName = props.displayName;
    if (props.pictureUrl !== undefined) this._pictureUrl = props.pictureUrl;
    if (props.email !== undefined) this._email = props.email;
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id.value;
  }

  get displayName(): string {
    return this._displayName;
  }

  get pictureUrl(): string | undefined {
    return this._pictureUrl;
  }

  get email(): string | undefined {
    return this._email;
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
