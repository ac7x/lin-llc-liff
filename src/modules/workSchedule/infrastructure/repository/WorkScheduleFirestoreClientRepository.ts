import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { VisTimelineGroup, VisTimelineItem } from '../../domain/model/valueObject/visTimelineValueObject'
import { WorkScheduleRepository } from '../../domain/repository/WorkScheduleRepository'

/**
 * Firebase client 端實作
 */
export class WorkScheduleFirestoreClientRepository implements WorkScheduleRepository {
    async getTimelineItems(): Promise<VisTimelineItem[]> {
        const snapshot = await getDocs(collection(firestore, 'workScheduleItems'))
        return snapshot.docs.map(docSnap => docSnap.data() as VisTimelineItem)
    }

    async getTimelineGroups(): Promise<VisTimelineGroup[]> {
        const snapshot = await getDocs(collection(firestore, 'workScheduleGroups'))
        return snapshot.docs.map(docSnap => docSnap.data() as VisTimelineGroup)
    }

    async setTimelineItem(item: VisTimelineItem): Promise<void> {
        await setDoc(doc(firestore, 'workScheduleItems', item.id), { ...item })
    }

    async removeTimelineItem(itemId: string): Promise<void> {
        await deleteDoc(doc(firestore, 'workScheduleItems', itemId))
    }
}
