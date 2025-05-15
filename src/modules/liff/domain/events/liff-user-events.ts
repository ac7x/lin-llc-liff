/**
 * LIFF 相關領域事件
 */

// 基礎領域事件介面
export interface DomainEvent {
  eventName: string;
  occurredAt: Date;
}

// 用戶登入事件
export class UserLoggedInEvent implements DomainEvent {
  readonly eventName = 'UserLoggedInEvent';
  readonly occurredAt: Date;
  
  constructor(
    public readonly userId: string,
    public readonly displayName: string
  ) {
    this.occurredAt = new Date();
  }
}

// 用戶登出事件
export class UserLoggedOutEvent implements DomainEvent {
  readonly eventName = 'UserLoggedOutEvent';
  readonly occurredAt: Date;
  
  constructor(
    public readonly userId: string
  ) {
    this.occurredAt = new Date();
  }
}

// 用戶個人資料更新事件
export class UserProfileUpdatedEvent implements DomainEvent {
  readonly eventName = 'UserProfileUpdatedEvent';
  readonly occurredAt: Date;
  
  constructor(
    public readonly userId: string,
    public readonly displayName: string,
    public readonly pictureUrl?: string,
    public readonly statusMessage?: string
  ) {
    this.occurredAt = new Date();
  }
}
