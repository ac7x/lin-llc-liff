// Redis 相關匯出
export { redisCache } from './redis.client'

// Firebase 相關匯出
export {
    firebaseApp,
    firestore
} from './firebase.client'

// Firebase Admin 相關匯出（已移除 redis 快取，僅 server 端用）
export {
    FirebaseAdminClient,
    firebaseAdminClient,
    firestoreAdmin
} from './firebase-admin.client'
