// 專責 timeline 相關事件監聽器 hook
// hooks/useTimelineEventHandlers.ts
import { useEffect } from 'react'

/**
 * 註冊 timeline 相關 DOM 事件監聽器
 * @param ref timeline 的 DOM ref
 * @param timelineInstance vis-timeline 實例
 * @param itemsDataSet vis-timeline items DataSet
 * @param unplanned 未排班工作
 * @param epics 專案列表
 * @param updateWorkLoadTime 更新工作負載時間的函式
 * @param patchWorkLoadLocal 本地 patch 工作負載的函式
 */
const useTimelineEventHandlers = (
    ref: React.RefObject<HTMLDivElement>,
    timelineInstance: any,
    itemsDataSet: any,
    unplanned: any[],
    epics: any[],
    updateWorkLoadTime: Function,
    patchWorkLoadLocal: Function
) => {
    useEffect(() => {
        if (!ref.current || !timelineInstance || !itemsDataSet) return
        const handleDragOver = (e: DragEvent) => e.preventDefault()
        const handleDrop = (e: DragEvent) => {
            e.preventDefault()
            try {
                const payload = JSON.parse(e.dataTransfer?.getData('text') || '{}')
                const point = timelineInstance.getEventProperties(e)
                if (!point.time) return
                const wl = unplanned.find(w => w.loadId === payload.id)
                if (!wl) return
                const groupId = payload.group || epics[0].epicId
                const startTime = new Date(point.time)
                startTime.setHours(0, 0, 0, 0)
                const endTime = new Date(startTime)
                endTime.setDate(startTime.getDate() + 1)
                updateWorkLoadTime(groupId, wl.loadId, startTime.toISOString(), endTime.toISOString()).then((updatedWorkLoad: any) => {
                    if (updatedWorkLoad) {
                        itemsDataSet.add({
                            id: wl.loadId,
                            group: groupId,
                            content: wl.title,
                            start: startTime,
                            end: endTime,
                            type: 'range'
                        })
                        patchWorkLoadLocal(updatedWorkLoad)
                    }
                })
            } catch { }
        }
        ref.current.addEventListener('dragover', handleDragOver)
        ref.current.addEventListener('drop', handleDrop)
        return () => {
            ref.current?.removeEventListener('dragover', handleDragOver)
            ref.current?.removeEventListener('drop', handleDrop)
        }
    }, [ref, timelineInstance, itemsDataSet, unplanned, epics, updateWorkLoadTime, patchWorkLoadLocal])
}

export default useTimelineEventHandlers
