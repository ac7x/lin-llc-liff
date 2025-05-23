import { firestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase-admin/adminApp'
import { VisTimelineGroup, VisTimelineItem } from '../../domain/model/valueObject/visTimelineValueObject'
import { WorkScheduleRepository } from '../../domain/repository/WorkScheduleRepository'

/**
 * Firebase admin 端實作
 */
export class WorkScheduleFirestoreAdminRepository implements WorkScheduleRepository {
    async getTimelineItems(): Promise<VisTimelineItem[]> {
        const snapshot = await firestoreAdmin.collection('workScheduleItems').get()
        return snapshot.docs.map((docSnap: any) => docSnap.data() as VisTimelineItem)
    }

    async getTimelineGroups(): Promise<VisTimelineGroup[]> {
        const snapshot = await firestoreAdmin.collection('workScheduleGroups').get()
        return snapshot.docs.map((docSnap: any) => docSnap.data() as VisTimelineGroup)
    }

    async setTimelineItem(item: VisTimelineItem): Promise<void> {
        await firestoreAdmin.collection('workScheduleItems').doc(item.id).set({ ...item })
    }

    async removeTimelineItem(itemId: string): Promise<void> {
        await firestoreAdmin.collection('workScheduleItems').doc(itemId).delete()
    }
}
