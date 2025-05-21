"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { WorkLoadEntity } from "@/app/actions/workload.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { DataGroup, DataItem, DataSet, Timeline, TimelineOptions } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

type State = {
    epics: WorkEpicEntity[];
};
type Action = { type: "SET_EPICS"; payload: WorkEpicEntity[] };
const initialState: State = { epics: [] };
const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "SET_EPICS":
            return { ...state, epics: action.payload };
        default:
            return state;
    }
};

function getTimelineGroupsAndItems(epics: WorkEpicEntity[]): { groups: DataGroup[]; items: DataItem[] } {
    if (!epics.length) return { groups: [], items: [] };
    const groups: DataGroup[] = epics.map(epic => ({
        id: epic.epicId,
        content: `<span style="font-weight:bold">${epic.title}</span>`
    }));
    const items: DataItem[] = epics.flatMap(epic =>
        (epic.workLoads || []).map((load: WorkLoadEntity) => {
            const executorStr = Array.isArray(load.executor) && load.executor.length > 0
                ? load.executor.join(", ")
                : typeof load.executor === "string" && load.executor
                    ? load.executor
                    : "(無執行者)";
            return {
                id: load.loadId,
                group: epic.epicId,
                content: `<div>
                    <div style="font-size:1rem;font-weight:600">${load.title || "(無標題)"}</div>
                    <div style="font-size:0.9rem;color:#888">${executorStr}</div>
                </div>`,
                start: load.plannedStartTime,
                end: load.plannedEndTime,
                title: `${load.title}<br/>${executorStr}`
            };
        })
    );
    return { groups, items };
}

const WorkSchedulePage: React.FC = () => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);

    // 編輯狀態
    const [groupsDS, setGroupsDS] = useState<DataSet<DataGroup> | null>(null);
    const [itemsDS, setItemsDS] = useState<DataSet<DataItem> | null>(null);

    // 載入資料
    useEffect(() => {
        getAllWorkEpics(false).then(data =>
            dispatch({ type: "SET_EPICS", payload: data as WorkEpicEntity[] })
        );
    }, []);

    // 初始化 timeline
    useEffect(() => {
        if (!timelineRef.current || !state.epics.length) return;
        const { groups, items } = getTimelineGroupsAndItems(state.epics);

        const groupsDataSet = new DataSet<DataGroup>(groups);
        const itemsDataSet = new DataSet<DataItem>(items);
        setGroupsDS(groupsDataSet);
        setItemsDS(itemsDataSet);

        const options: TimelineOptions = {
            stack: false,
            orientation: "top",
            editable: false,
            locale: "zh-tw",
            tooltip: { followMouse: true },
            margin: { item: 10, axis: 5 },
            groupOrder: "content"
        };

        const tl = new Timeline(timelineRef.current, itemsDataSet, groupsDataSet, options);

        return () => {
            tl.destroy();
        };
    }, [state.epics]);

    // 新增群組
    const handleAddGroup = () => {
        if (!groupsDS) return;
        const name = window.prompt("請輸入新專案標的名稱：");
        if (!name) return;
        const id = "epic-" + Date.now();
        groupsDS.add({ id, content: `<span style="font-weight:bold">${name}</span>` });
    };

    // 刪除群組
    const handleRemoveGroup = () => {
        if (!groupsDS) return;
        const id = window.prompt("請輸入要刪除的 epicId：");
        if (!id) return;
        groupsDS.remove(id);
        // 若需同步 items 也刪除可加上
        if (itemsDS) {
            itemsDS.forEach(item => {
                if (item.group === id) itemsDS.remove(item.id as string);
            });
        }
    };

    // 改名群組，修正型別問題
    const handleRenameGroup = () => {
        if (!groupsDS) return;
        const id = window.prompt("請輸入要改名的 epicId：");
        if (!id) return;
        const group = groupsDS.get(id);
        if (!group) return;

        let contentStr = "";
        if (typeof group.content === "string") {
            contentStr = group.content.replace(/<[^>]*>/g, "");
        } else if (group.content instanceof HTMLElement) {
            contentStr = group.content.textContent ?? "";
        }
        const newName = window.prompt("新名稱：", contentStr);
        if (!newName) return;
        groupsDS.update({ id, content: `<span style="font-weight:bold">${newName}</span>` });
    };

    return (
        <>
            <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-4 m-4">
                <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
                <div className="flex gap-2 mb-2">
                    <button onClick={handleAddGroup} className="px-2 py-1 bg-blue-500 text-white rounded">新增標的</button>
                    <button onClick={handleRemoveGroup} className="px-2 py-1 bg-red-500 text-white rounded">刪除標的</button>
                    <button onClick={handleRenameGroup} className="px-2 py-1 bg-yellow-500 text-black rounded">改名標的</button>
                </div>
                <div ref={timelineRef} style={{ height: 400, minHeight: 300 }} />
            </div>
            <ClientBottomNav />
        </>
    );
};

export default WorkSchedulePage;