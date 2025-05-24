"use server";

import admin from 'firebase-admin';

/**
 * Firebase Admin 客戶端（單例）
 * 初始化 Firebase Admin SDK 並提供 Firestore 操作
 */
class FirebaseAdminClient {
  private static instance: FirebaseAdminClient
  private firestore: admin.firestore.Firestore

  private constructor() {
    if (!admin.apps.length) {
      admin.initializeApp()
    }
    this.firestore = admin.firestore()
  }

  /**
   * 取得單例實例
   */
  static getInstance(): FirebaseAdminClient {
    return this.instance ?? (this.instance = new FirebaseAdminClient())
  }

  /**
   * 取得 Firestore 實例
   */
  getFirestore(): admin.firestore.Firestore {
    return this.firestore
  }
}

/**
 * 取得 FirebaseAdminClient 實例
 */
export async function getFirebaseAdminClient() {
  return FirebaseAdminClient.getInstance()
}

/**
 * 取得 Firestore Admin 實例
 */
export async function getFirestoreAdmin() {
  return FirebaseAdminClient.getInstance().getFirestore()
}

/**
 * 工作負載資料型別
 */
type WorkLoadEntity = {
  loadId: string
  title: string
  executor: string[]
  plannedStartTime: string
  plannedEndTime: string
}

/**
 * 工作 Epic 資料型別
 */
type WorkEpicEntity = {
  epicId: string
  title: string
  workLoads?: WorkLoadEntity[]
}

/**
 * 取得所有 workEpic 文件
 */
export async function getAllWorkEpics(): Promise<WorkEpicEntity[]> {
  const firestore = await getFirestoreAdmin()
  const snapshot = await firestore.collection("workEpic").get()
  return snapshot.docs.map(doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity))
}

/**
 * 更新指定 workEpic 的 workLoads 欄位
 * @param epicId workEpic 文件 ID
 * @param workLoads 新的 workLoads 陣列
 */
export async function updateWorkEpicWorkLoads(epicId: string, workLoads: WorkLoadEntity[]): Promise<void> {
  const firestore = await getFirestoreAdmin()
  await firestore.collection("workEpic").doc(epicId).update({ workLoads })
}
