import { LineUserIdValueObject } from "../valueObjects/line-user-id.value-object";

/**
 * LINE 用戶實體
 * 代表 LINE 平台上的用戶
 */
export class LiffUserEntity {
  private _userId: LineUserIdValueObject;
  private _displayName: string;
  private _pictureUrl?: string;
  private _statusMessage?: string;
  private _isLoggedIn: boolean;

  constructor(props: {
    userId: LineUserIdValueObject;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
    isLoggedIn: boolean;
  }) {
    this._userId = props.userId;
    this._displayName = props.displayName;
    this._pictureUrl = props.pictureUrl;
    this._statusMessage = props.statusMessage;
    this._isLoggedIn = props.isLoggedIn;
  }

  // 靜態工廠方法
  public static create(props: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
    isLoggedIn: boolean;
  }): LiffUserEntity {
    return new LiffUserEntity({
      userId: new LineUserIdValueObject(props.userId),
      displayName: props.displayName,
      pictureUrl: props.pictureUrl,
      statusMessage: props.statusMessage,
      isLoggedIn: props.isLoggedIn
    });
  }

  // 建立未登入的預設用戶
  public static createDefault(): LiffUserEntity {
    return new LiffUserEntity({
      userId: new LineUserIdValueObject("guest"),
      displayName: "訪客",
      isLoggedIn: false
    });
  }

  // 領域行為 - 登入
  public login(): void {
    this._isLoggedIn = true;
  }

  // 領域行為 - 登出
  public logout(): void {
    this._isLoggedIn = false;
  }

  // 更新個人資料
  public updateProfile(props: {
    displayName?: string;
    pictureUrl?: string;
    statusMessage?: string;
  }): void {
    if (props.displayName) this._displayName = props.displayName;
    if (props.pictureUrl) this._pictureUrl = props.pictureUrl;
    if (props.statusMessage) this._statusMessage = props.statusMessage;
  }

  // 取值方法
  get userId(): string {
    return this._userId.value;
  }

  get displayName(): string {
    return this._displayName;
  }

  get pictureUrl(): string | undefined {
    return this._pictureUrl;
  }

  get statusMessage(): string | undefined {
    return this._statusMessage;
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }
}
