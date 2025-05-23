import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { redisCache } from './redis.client'

const firebaseConfig = {
  apiKey: "AIzaSyDsJP6_bjWLQ0SQiarhe3UIApnqx60vCqg",
  authDomain: "lin-llc-liff.firebaseapp.com",
  projectId: "lin-llc-liff",
  storageBucket: "lin-llc-liff.firebasestorage.app",
  messagingSenderId: "734381604026",
  appId: "1:734381604026:web:a07a50fe85c6c5acd25683",
  measurementId: "G-KBMLTJL6KK"
}

const CACHE_KEYS = {
  FIRESTORE: 'firestore:client'
} as const

const CACHE_TIMES = {
  FIVE_MINUTES: 300,
  EXPIRE_NOW: 1
} as const

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig)

export const getFirestoreWithCache = async (): Promise<Firestore> => {
  const cached = await redisCache.get(CACHE_KEYS.FIRESTORE)
  if (cached) {
    try {
      return JSON.parse(cached) as Firestore
    } catch {
      // 快取解析失敗，繼續執行查詢
    }
  }

  const firestore = getFirestore(firebaseApp)
  await redisCache.set(CACHE_KEYS.FIRESTORE, JSON.stringify(firestore), CACHE_TIMES.FIVE_MINUTES)
  return firestore
}

export const firestore: Firestore = await getFirestoreWithCache()
