import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

/**
 * Firebase Admin SDK 連接類
 * 用於後端服務連接 Firebase 服務
 */
export class FirebaseAdmin {
  private static instance: FirebaseAdmin;
  private _firestore: Firestore;
  private _auth: Auth;
  private _storage: Storage;
  
  private constructor() {
    // 檢查是否已經初始化過
    if (getApps().length === 0) {
      // 初始化方式 1：使用環境變數中的 JSON 字符串
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          initializeApp({
            credential: cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
          });
        } catch (error) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
          throw error;
        }
      } 
      // 初始化方式 2：使用 Google Cloud 環境中的默認憑證
      else {
        initializeApp();
      }
    }
    
    this._firestore = getFirestore();
    this._auth = getAuth();
    this._storage = getStorage();
  }
  
  /**
   * 獲取 Firebase Admin 單例
   */
  public static getInstance(): FirebaseAdmin {
    if (!FirebaseAdmin.instance) {
      FirebaseAdmin.instance = new FirebaseAdmin();
    }
    return FirebaseAdmin.instance;
  }
  
  /**
   * 獲取 Firestore 實例
   */
  get firestore(): Firestore {
    return this._firestore;
  }
  
  /**
   * 獲取 Auth 實例
   */
  get auth(): Auth {
    return this._auth;
  }
  
  /**
   * 獲取 Storage 實例
   */
  get storage(): Storage {
    return this._storage;
  }
}

/**
 * 獲取 Admin Firestore 實例的便捷函數
 */
export const getFirestoreAdmin = (): Firestore => {
  return FirebaseAdmin.getInstance().firestore;
};

/**
 * 獲取 Admin Auth 實例的便捷函數
 */
export const getAuthAdmin = (): Auth => {
  return FirebaseAdmin.getInstance().auth;
};

/**
 * 獲取 Admin Storage 實例的便捷函數
 */
export const getStorageAdmin = (): Storage => {
  return FirebaseAdmin.getInstance().storage;
};
