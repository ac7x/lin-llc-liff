import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

/**
 * Firebase 客戶端連接類
 * 用於前端連接 Firebase 服務
 */
export class FirebaseClient {
  private static instance: FirebaseClient;
  private app: FirebaseApp;
  private _firestore: Firestore;
  private _auth: Auth;
  private _storage: FirebaseStorage;
  
  private constructor() {
    // 從環境變數獲取設定
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    // 初始化 Firebase App
    this.app = initializeApp(firebaseConfig);
    this._firestore = getFirestore(this.app);
    this._auth = getAuth(this.app);
    this._storage = getStorage(this.app);
  }
  
  /**
   * 獲取 Firebase Client 單例
   */
  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
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
  get storage(): FirebaseStorage {
    return this._storage;
  }
}

/**
 * 獲取 Firestore 實例的便捷函數
 */
export const getFirestoreClient = (): Firestore => {
  return FirebaseClient.getInstance().firestore;
};

/**
 * 獲取 Auth 實例的便捷函數
 */
export const getAuthClient = (): Auth => {
  return FirebaseClient.getInstance().auth;
};

/**
 * 獲取 Storage 實例的便捷函數
 */
export const getStorageClient = (): FirebaseStorage => {
  return FirebaseClient.getInstance().storage;
};
