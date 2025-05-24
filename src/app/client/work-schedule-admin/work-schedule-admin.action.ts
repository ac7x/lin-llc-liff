"use server";

import type { WorkLoadEntity } from '@/app/actions/workload.action';

// --- Firebase Admin 客戶端（單例）實現開始 ---
import admin from 'firebase-admin';

/**
 * Firebase Admin 客戶端（單例）
 * 初始化 Firebase Admin SDK 並提供 Firestore 操作
 */
class FirebaseAdminClient {
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
  getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }
}

const firebaseAdminClient = FirebaseAdminClient.getInstance();
const firestoreAdmin = firebaseAdminClient.getFirestore();
// --- Firebase Admin 客戶端（單例）實現結束 ---

/**
 * 新增 WorkLoad 到指定 Epic
 */
export async function addWorkLoadToEpic(epicId: string, load: WorkLoadEntity): Promise<void> {
  const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
  await firestoreAdmin.runTransaction(async transaction => {
    const epicDoc = await transaction.get(epicRef)
    const data = epicDoc.exists ? epicDoc.data() : undefined
    if (!data) throw new Error('Epic 不存在')
    const workLoads = Array.isArray(data.workLoads) ? [...data.workLoads, load] : [load]
    transaction.update(epicRef, { workLoads })
  })
}