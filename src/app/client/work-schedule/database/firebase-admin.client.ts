import admin from 'firebase-admin';
import { redisCache } from './redis.client';

const CACHE_KEYS = {
  FIRESTORE: 'firestore:admin'
} as const;

const CACHE_TIMES = {
  FIVE_MINUTES: 300,
  EXPIRE_NOW: 1
} as const;

/**
 * Firebase Admin 客戶端（單例）
 * 初始化 Firebase Admin SDK 並提供 Firestore 操作
 */
export class FirebaseAdminClient {
  private static instance: FirebaseAdminClient;
  private firestore: admin.firestore.Firestore;

  private constructor() {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.firestore = admin.firestore();
  }

  /**
   * 取得單例實例
   */
  static getInstance(): FirebaseAdminClient {
    return this.instance ?? (this.instance = new FirebaseAdminClient());
  }

  /**
   * 取得 Firestore 實例
   */
  async getFirestore(): Promise<admin.firestore.Firestore> {
    const cached = await redisCache.get(CACHE_KEYS.FIRESTORE);
    if (cached) {
      try {
        return JSON.parse(cached) as admin.firestore.Firestore;
      } catch {
        // 快取解析失敗，繼續執行查詢
      }
    }

    await redisCache.set(CACHE_KEYS.FIRESTORE, JSON.stringify(this.firestore), CACHE_TIMES.FIVE_MINUTES);
    return this.firestore;
  }
}

export const firebaseAdminClient = FirebaseAdminClient.getInstance();
export const firestoreAdmin = await firebaseAdminClient.getFirestore();
