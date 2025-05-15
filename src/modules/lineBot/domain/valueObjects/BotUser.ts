export class BotUser {
  private readonly _userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('userId 不能為空');
    }
    this._userId = userId;
  }

  get userId(): string {
    return this._userId;
  }

  equals(other: BotUser): boolean {
    return this._userId === other._userId;
  }
}
