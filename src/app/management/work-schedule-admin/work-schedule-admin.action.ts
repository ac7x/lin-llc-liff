'use server'

import admin from 'firebase-admin'

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

async function getFirestoreAdmin() {
  return FirebaseAdminClient.getInstance().getFirestore()
}

type WorkLoadEntity = {
  loadId: string
  title: string
  executor: string[]
  plannedStartTime: string
  plannedEndTime: string
}

type WorkEpicEntity = {
  epicId: string
  title: string
  workLoads?: WorkLoadEntity[]
}

export async function getAllWorkEpics(): Promise<WorkEpicEntity[]> {
  const firestore = await getFirestoreAdmin()
  const snapshot = await firestore.collection('workEpic').get()
  return snapshot.docs.map(doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity))
}

export async function updateWorkEpicWorkLoads(epicId: string, workLoads: WorkLoadEntity[]): Promise<void> {
  const firestore = await getFirestoreAdmin()
  await firestore.collection('workEpic').doc(epicId).update({ workLoads })
}

export async function updateWorkLoad(epicId: string, loadId: string, updates: Partial<WorkLoadEntity>): Promise<void> {
  const firestore = await getFirestoreAdmin()
  const epicDoc = await firestore.collection('workEpic').doc(epicId).get()
  if (!epicDoc.exists) return
  const epicData = epicDoc.data() as WorkEpicEntity
  const workLoads = epicData.workLoads || []
  const loadIndex = workLoads.findIndex(load => load.loadId === loadId)
  if (loadIndex === -1) return
  workLoads[loadIndex] = { ...workLoads[loadIndex], ...updates }
  await firestore.collection('workEpic').doc(epicId).update({ workLoads })
}
