'use server'

import admin from 'firebase-admin'

export interface WorkLoadEntity {
  loadId: string
  title: string
  executor: string[]
  plannedStartTime: string
  plannedEndTime: string
}
export interface WorkEpicEntity {
  epicId: string
  title: string
  workLoads?: WorkLoadEntity[]
}
export type LooseWorkLoad = WorkLoadEntity & { epicId: string, epicTitle: string }

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

const firestoreAdmin = FirebaseAdminClient.getInstance().getFirestore()

export async function getAllEpics(): Promise<{ epics: WorkEpicEntity[], unplanned: LooseWorkLoad[] }> {
  const snapshot = await firestoreAdmin.collection('workEpic').get()
  const epics: WorkEpicEntity[] = snapshot.docs.map(doc => ({
    ...doc.data(),
    epicId: doc.id,
  }) as WorkEpicEntity)
  const unplanned: LooseWorkLoad[] = epics.flatMap(e =>
    (e.workLoads || [])
      .filter(l => !l.plannedStartTime || l.plannedStartTime === '')
      .map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
  )
  return { epics, unplanned }
}

export async function updateWorkLoad(epicId: string, loadId: string, start: string, end: string | null): Promise<void> {
  const epicRef = firestoreAdmin.collection('workEpic').doc(epicId)
  await firestoreAdmin.runTransaction(async transaction => {
    const epicDoc = await transaction.get(epicRef)
    if (!epicDoc.exists) throw new Error('Epic 不存在')
    const data = epicDoc.data()
    const workLoads: WorkLoadEntity[] = Array.isArray(data.workLoads) ? data.workLoads : []
    const idx = workLoads.findIndex(wl => wl.loadId === loadId)
    if (idx === -1) throw new Error('WorkLoad 不存在')
    workLoads[idx].plannedStartTime = new Date(start).toISOString()
    workLoads[idx].plannedEndTime = end ? new Date(end).toISOString() : ''
    transaction.update(epicRef, { workLoads })
  })
}

export async function unplanWorkLoad(loadId: string): Promise<void> {
  const epicSnap = await firestoreAdmin.collection('workEpic').get()
  let foundEpicId: string | null = null
  let foundIdx = -1
  let foundWorkLoads: WorkLoadEntity[] = []
  epicSnap.forEach(doc => {
    const workLoads: WorkLoadEntity[] = doc.data().workLoads || []
    const idx = workLoads.findIndex(wl => wl.loadId === loadId)
    if (idx !== -1) {
      foundEpicId = doc.id
      foundIdx = idx
      foundWorkLoads = workLoads
    }
  })
  if (!foundEpicId || foundIdx === -1) return
  foundWorkLoads[foundIdx].plannedStartTime = ''
  foundWorkLoads[foundIdx].plannedEndTime = ''
  await firestoreAdmin.collection('workEpic').doc(foundEpicId).update({ workLoads: foundWorkLoads })
}