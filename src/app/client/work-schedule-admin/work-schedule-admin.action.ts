// src/app/client/work-schedule-admin/work-schedule-admin.action.ts

import admin from 'firebase-admin'

/**
 * TestWorkLoadEntity 工作負載資料結構
 */
export interface TestWorkLoadEntity {
  loadId: string
  plannedStartTime: string
  plannedEndTime: string
  title: string
}

/**
 * TestWorkEpicEntity 史詩資料結構
 */
export interface TestWorkEpicEntity {
  epicId: string
  title: string
  workLoads?: TestWorkLoadEntity[]
}

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

const firebaseAdminClient = FirebaseAdminClient.getInstance()
const firestoreAdmin = firebaseAdminClient.getFirestore()

/**
 * 取得所有 TestWorkEpicEntity
 */
export const getAllTestEpics = async (): Promise<{ epics: TestWorkEpicEntity[] }> => {
  const snapshot = await firestoreAdmin.collection('testEpics').get()
  const epics: TestWorkEpicEntity[] = []
  snapshot.forEach(doc => {
    const data = doc.data() as TestWorkEpicEntity
    epics.push({
      ...data,
      epicId: doc.id,
      workLoads: data.workLoads ?? []
    })
  })
  return { epics }
}

/**
 * 建立新的 TestWorkEpicEntity
 * @param title 史詩標題
 */
export const createTestEpic = async (title: string): Promise<void> => {
  await firestoreAdmin.collection('testEpics').add({
    title,
    workLoads: []
  })
}

/**
 * 在指定 Epic 下建立新的 TestWorkLoadEntity
 * @param epicId 目標 Epic 的 ID
 * @param title 工作標題
 * @param start 預定開始時間
 * @param end 預定結束時間
 */
export const createTestWorkLoad = async (
  epicId: string,
  title: string,
  start: string,
  end: string
): Promise<void> => {
  const epicRef = firestoreAdmin.collection('testEpics').doc(epicId)
  const epicSnap = await epicRef.get()
  if (!epicSnap.exists) {
    return
  }
  const epic = epicSnap.data() as TestWorkEpicEntity
  const workLoads = epic.workLoads ?? []
  workLoads.push({
    loadId: Math.random().toString(36).slice(2, 10),
    title,
    plannedStartTime: start,
    plannedEndTime: end
  })
  await epicRef.update({ workLoads })
}

/**
 * 刪除指定的 TestWorkLoadEntity
 * @param loadId 工作負載 ID
 */
export const deleteTestWorkLoad = async (loadId: string): Promise<void> => {
  const snapshot = await firestoreAdmin.collection('testEpics').get()
  for (const doc of snapshot.docs) {
    const epic = doc.data() as TestWorkEpicEntity
    const workLoads = epic.workLoads ?? []
    const idx = workLoads.findIndex(wl => wl.loadId === loadId)
    if (idx !== -1) {
      workLoads.splice(idx, 1)
      await doc.ref.update({ workLoads })
      break
    }
  }
}