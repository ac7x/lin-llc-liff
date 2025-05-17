import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

// Firebase configuration (硬編碼版)
const firebaseConfig = {
  apiKey: "AIzaSyDsJP6_bjWLQ0SQiarhe3UIApnqx60vCqg",
  authDomain: "lin-llc-liff.firebaseapp.com",
  projectId: "lin-llc-liff",
  storageBucket: "lin-llc-liff.firebasestorage.app",
  messagingSenderId: "734381604026",
  appId: "1:734381604026:web:a07a50fe85c6c5acd25683",
  measurementId: "G-KBMLTJL6KK"
};

/**
 * Firebase 客戶端類別 - 單例模式
 * 用於初始化 Firebase 應用並提供 Firestore 資料庫操作功能
 */
export class FirebaseClient {
  private static instance: FirebaseClient;
  private app: FirebaseApp;
  private firestore: Firestore;

  private constructor() {
    this.app = initializeApp(firebaseConfig);
    this.firestore = getFirestore(this.app);
  }

  /**
   * 獲取 FirebaseClient 的單例實例
   */
  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  /**
   * 獲取 Firestore 資料庫實例
   */
  public getFirestore(): Firestore {
    return this.firestore;
  }

  /**
   * 獲取 FirebaseApp 實例
   */
  public getApp(): FirebaseApp {
    return this.app;
  }
}

// 匯出單例實例和 Firestore 實例供直接使用
export const firebaseClient = FirebaseClient.getInstance();
export const firestore = firebaseClient.getFirestore();
export const firebaseApp = firebaseClient.getApp();
