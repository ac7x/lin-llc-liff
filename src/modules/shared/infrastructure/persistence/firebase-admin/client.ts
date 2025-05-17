import admin from 'firebase-admin';

/**
 * Firebase Admin 客戶端類別 - 單例模式
 * 用於初始化 Firebase Admin SDK 並提供 Firestore 資料庫操作功能
 */
export class FirebaseAdminClient {
  private static instance: FirebaseAdminClient;
  private firestore: admin.firestore.Firestore;

  private constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.firestore = admin.firestore();
  }

  /**
   * 獲取 FirebaseAdminClient 的單例實例
   */
  public static getInstance(): FirebaseAdminClient {
    if (!FirebaseAdminClient.instance) {
      FirebaseAdminClient.instance = new FirebaseAdminClient();
    }
    return FirebaseAdminClient.instance;
  }

  /**
   * 獲取 Firestore 資料庫實例
   */
  public getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }
}

// 匯出單例實例和 Firestore 實例供直接使用
export const firebaseAdminClient = FirebaseAdminClient.getInstance();
export const firestoreAdmin = firebaseAdminClient.getFirestore();
