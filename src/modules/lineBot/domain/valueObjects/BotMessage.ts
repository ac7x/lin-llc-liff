export class BotMessage {
  private readonly _text: string;
  private readonly _userId: string;

  constructor(text: string, userId: string) {
    this._text = text;
    this._userId = userId;
  }

  get text(): string {
    return this._text;
  }

  get userId(): string {
    return this._userId;
  }

  static createWelcomeMessage(userId: string): BotMessage {
    return new BotMessage('感謝您加入我們！', userId);
  }

  toLineReplyFormat(): any {
    return {
      type: 'text',
      text: this._text,
    };
  }
}
