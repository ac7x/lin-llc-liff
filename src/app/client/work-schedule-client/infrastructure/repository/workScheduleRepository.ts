// 與 firebase、redis、memcached 協作的 repository
// repository/workScheduleRepository.ts
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { doc, runTransaction } from 'firebase/firestore'

/**
 * 更新工作負載時間
 * @param epicId 專案 ID
 * @param loadId 工作負載 ID
 * @param plannedStartTime 計畫開始時間
 * @param plannedEndTime 計畫結束時間
 */
export const updateWorkLoadTime = async (
    epicId: string,
    loadId: string,
    plannedStartTime: string,
    plannedEndTime: string | null
) => {
    if (!epicId || !loadId || !plannedStartTime) throw new Error('缺少必要參數')
    const epicRef = doc(firestore, 'workEpic', epicId)
    let updatedWorkLoad = null
    await runTransaction(firestore, async transaction => {
        const epicDoc = await transaction.get(epicRef)
        if (!epicDoc.exists()) return
        const epicData = epicDoc.data()
        if (!epicData || !Array.isArray(epicData.workLoads)) return
        const workLoads = [...epicData.workLoads]
        const idx = workLoads.findIndex((wl: any) => wl.loadId === loadId)
        if (idx !== -1) {
            workLoads[idx] = { ...workLoads[idx], plannedStartTime, plannedEndTime }
            updatedWorkLoad = workLoads[idx]
        }
        transaction.update(epicRef, { workLoads })
    })
    return updatedWorkLoad
}
