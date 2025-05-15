// LINE 訊息類型定義 - v3 API

// 基本訊息物件介面
export interface MessageObject {
  type: MessageType;
  [key: string]: any;
}

// 訊息類型
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'location'
  | 'sticker'
  | 'template'
  | 'flex'
  | 'imagemap';

// Webhook 事件類型
export interface WebhookEvent {
  type: WebhookEventType;
  mode: 'active' | 'standby';
  timestamp: number;
  source: EventSource;
  webhookEventId?: string;
  deliveryContext?: {
    isRedelivery: boolean;
  };
  [key: string]: any;
}

export type WebhookEventType =
  | 'message'
  | 'follow'
  | 'unfollow'
  | 'join'
  | 'leave'
  | 'memberJoined'
  | 'memberLeft'
  | 'postback'
  | 'beacon'
  | 'accountLink'
  | 'things';

export interface EventSource {
  type: 'user' | 'group' | 'room';
  userId?: string;
  groupId?: string;
  roomId?: string;
}

// 訊息事件
export interface MessageEvent extends WebhookEvent {
  type: 'message';
  message: {
    id: string;
    type: MessageType;
    [key: string]: any;
  };
  replyToken: string;
}

// 文字訊息
export interface TextMessage extends MessageObject {
  type: 'text';
  text: string;
  emojis?: {
    index: number;
    length: number;
    productId: string;
    emojiId: string;
  }[];
  quoteToken?: string;
}
