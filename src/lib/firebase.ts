import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeContainer } from '../modules/liff/infrastructure/di/container';

/**
 * Firebase 設定
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

/**
 * 初始化 Firebase
 * 確保只初始化一次 Firebase，並初始化相關容器
 */
let firebaseApp: FirebaseApp | undefined;

export function initializeFirebase(): FirebaseApp {
  if (typeof window === 'undefined') {
    // 在服務器端不初始化 Firebase
    return {} as FirebaseApp;
  }
  
  if (firebaseApp) {
    return firebaseApp;
  }
  
  // 只初始化一次 Firebase
  const apps = getApps();
  if (!apps.length) {
    firebaseApp = initializeApp(firebaseConfig);
    
    // 初始化依賴注入容器
    initializeContainer(firebaseApp);
  } else {
    firebaseApp = apps[0];
  }
  
  return firebaseApp;
}

/**
 * 取得 Firestore 實例
 */
export function getFirestoreInstance() {
  const app = initializeFirebase();
  return getFirestore(app);
}

/**
 * 取得 Auth 實例
 */
export function getAuthInstance() {
  const app = initializeFirebase();
  return getAuth(app);
}
