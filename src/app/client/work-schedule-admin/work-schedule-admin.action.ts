"use server";

import admin from 'firebase-admin';

/**
 * 工作負載資料結構
 */
export interface TestWorkLoadEntity {
  loadId: string
  plannedStartTime: string
  plannedEndTime: string
  title: string
}

/**
 * 史詩資料結構
 */
export interface TestWorkEpicEntity {
  epicId: string
  title: string
  workLoads?: TestWorkLoadEntity[]
}

/**
 * Firebase Admin 客戶端（單例）
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

  static getInstance(): FirebaseAdminClient {
    return this.instance ?? (this.instance = new FirebaseAdminClient())
  }

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