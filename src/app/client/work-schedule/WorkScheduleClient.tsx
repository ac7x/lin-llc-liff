"use client"

import { updateWorkLoadTime } from "@/app/actions/workschedule.action"
import { ClientBottomNav } from '@/modules/shared/interfaces/navigation/ClientBottomNav'
import React, { useEffect, useRef, useState } from 'react'
import { DataGroup, DataItem, DataSet, Timeline } from 'vis-timeline/standalone'
import "vis-timeline/styles/vis-timeline-graph2d.min.css"

/**
 * @param epics 所有專案標的與其工作負載
 */
type WorkEpicEntity = {
    epicId: string
    title: string
    workLoads?: WorkLoadEntity[]
}

type WorkLoadEntity = {
    loadId: string
    title: string
    executor: string[] | string
    plannedStartTime: string
    plannedEndTime?: string
}

type Props = {
    epics: WorkEpicEntity[]
}

const WorkScheduleClient: React.FC<Props> = ({ epics }) => {
    const timelineRef = useRef<HTMLDivElement>(null)
    const [groupsDS, setGroupsDS] = useState<DataSet<DataGroup> | null>(null)
    const [itemsDS, setItemsDS] = useState<DataSet<DataItem> | null>(null)

    useEffect(() => {
        const groups = epics.map(epic => ({
            id: epic.epicId,
            content: `<span style="font-weight:bold">${epic.title}</span>`
        }))
        const items = epics.flatMap(epic =>
            (epic.workLoads || []).map(load => ({
                id: load.loadId,
                group: epic.epicId,
                content: `<div>
                    <div style="font-size:1rem;font-weight:600">${load.title || "(無標題)"}</div>
                    <div style="font-size:0.9rem;color:#888">${Array.isArray(load.executor) && load.executor.length > 0
                        ? load.executor.join(", ")
                        : typeof load.executor === "string" && load.executor
                            ? load.executor
                            : "(無執行者)"
                    }</div>
                </div>`,
                start: load.plannedStartTime,
                end: load.plannedEndTime || undefined,
                title: `${load.title}<br/>${Array.isArray(load.executor) ? load.executor.join(", ") : load.executor || ""}`
            }))
        )
        const gds = new DataSet<DataGroup>(groups)
        const ids = new DataSet<DataItem>(items)
        setGroupsDS(gds)
        setItemsDS(ids)
        if (timelineRef.current) {
            const tl = new Timeline(timelineRef.current, ids, gds, {
                stack: false,
                orientation: "top",
                editable: true, // 允許拖曳
                locale: "zh-tw",
                tooltip: { followMouse: true },
                margin: { item: 10, axis: 5 },
                groupOrder: "content",
                zoomMin: 1000 * 60 * 60 * 24,
                zoomMax: 1000 * 60 * 60 * 24 * 30,
                timeAxis: { scale: "day", step: 1 }
            })

            // 拖曳結束事件
            tl.on('change', async (props) => {
                // 這裡可根據 vis-timeline 版本調整事件名稱與參數
                // 但通常是 'move' 或 'update'
            })

            tl.on('move', async ({ item, start, end, event }) => {
                const dataItem = ids.get(item)
                if (!dataItem) {
                    return
                }
                const epicId = dataItem.group as string
                const loadId = dataItem.id as string
                await updateWorkLoadTime(
                    epicId,
                    loadId,
                    start.toISOString(),
                    end ? end.toISOString() : null,
                    { toCache: true, toFirestore: false } // 只寫 Redis
                )
            })

            return () => tl.destroy()
        }
    }, [epics])

    const handleAddGroup = () => {
        if (!groupsDS) {
            return
        }
        const name = window.prompt("請輸入新專案標的名稱：")
        if (!name) {
            return
        }
        const id = "epic-" + Date.now()
        groupsDS.add({ id, content: `<span style="font-weight:bold">${name}</span>` })
    }

    const handleRemoveGroup = () => {
        if (!groupsDS) {
            return
        }
        const id = window.prompt("請輸入要刪除的 epicId：")
        if (!id) {
            return
        }
        groupsDS.remove(id)
        if (itemsDS) {
            itemsDS.forEach(item => {
                if (item.group === id) {
                    itemsDS.remove(item.id as string)
                }
            })
        }
    }

    const handleRenameGroup = () => {
        if (!groupsDS) {
            return
        }
        const id = window.prompt("請輸入要改名的 epicId：")
        if (!id) {
            return
        }
        const group = groupsDS.get(id)
        if (!group) {
            return
        }
        let contentStr = ""
        if (typeof group.content === "string") {
            contentStr = group.content.replace(/<[^>]*>/g, "")
        } else if (group.content instanceof HTMLElement) {
            contentStr = group.content.textContent ?? ""
        }
        const newName = window.prompt("新名稱：", contentStr)
        if (!newName) {
            return
        }
        groupsDS.update({ id, content: `<span style="font-weight:bold">${newName}</span>` })
    }

    return (
        <>
            <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-4 m-4">
                <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
                <div className="flex gap-2 mb-2">
                    <button onClick={handleAddGroup} className="px-2 py-1 bg-blue-500 text-white rounded">新增標的</button>
                    <button onClick={handleRemoveGroup} className="px-2 py-1 bg-red-500 text-white rounded">刪除標的</button>
                    <button onClick={handleRenameGroup} className="px-2 py-1 bg-yellow-500 text-black rounded">改名標的</button>
                </div>
                <div ref={timelineRef} className="timeline-container h-[400px] w-full" />
            </div>
            <ClientBottomNav />
        </>
    )
}

export default WorkScheduleClient