import { WorkEpicEntity } from '../domain/WorkEpicEntity'
import { WorkLoadEntity } from '../domain/WorkLoadEntity'
import { LooseWorkLoad } from '../domain/timeline.types'
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

/**
 * Timeline 應用服務
 */
export class TimelineService {
	/**
	 * 解析 Epic Firestore 快照資料
	 */
	static parseEpicSnapshot(
		docs: QueryDocumentSnapshot<DocumentData, DocumentData>[]
	): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } {
		const epics: WorkEpicEntity[] = docs.map(
			doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity)
		)

		const unplanned: LooseWorkLoad[] = epics.flatMap(e =>
			(e.workLoads || [])
				.filter(l => !l.plannedStartTime)
				.map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
		)

		return { epics, unplanned }
	}

	/**
	 * 更新專案清單中的工作負載
	 */
	static updateWorkLoadInEpics(
		epics: WorkEpicEntity[],
		updatedWorkLoad: WorkLoadEntity
	): WorkEpicEntity[] {
		return epics.map(epic =>
			updatedWorkLoad.epicIds?.includes(epic.epicId)
				? {
					...epic,
					workLoads: (epic.workLoads || []).map(load =>
						load.loadId === updatedWorkLoad.loadId ? updatedWorkLoad : load
					)
				}
				: epic
		)
	}

	/**
	 * 從未排班清單中移除已排班的工作負載
	 */
	static removeFromUnplanned(
		unplanned: LooseWorkLoad[],
		loadId: string
	): LooseWorkLoad[] {
		return unplanned.filter(x => x.loadId !== loadId)
	}
}
