"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { WorkLoadEntity } from "@/app/actions/workload.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import React, { useEffect, useRef, useState } from "react";
import { DataGroup, DataItem, DataSet, Timeline, TimelineOptions } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import styles from "./page.module.css";

const getExecutorStr = (executor: string[] | string | null | undefined): string =>
    Array.isArray(executor) && executor.length ? executor.join(", ")
        : typeof executor === "string" && executor ? executor : "(無執行者)";

const getTimelineGroupsAndItems = (epics: WorkEpicEntity[]) => {
    const groups: DataGroup[] = epics.map(epic => ({
        id: epic.epicId,
        content: `<span style="font-weight:bold">${epic.title}</span>`
    }));

    const items: DataItem[] = epics.flatMap(epic =>
        (epic.workLoads || [])
            .filter(load => load.plannedStartTime && load.plannedEndTime)
            .map(load => {
                const executorStr = getExecutorStr(load.executor);
                return {
                    id: load.loadId,
                    group: epic.epicId,
                    content: `<div><div style="font-size:1rem;font-weight:600">${load.title || "(無標題)"}</div><div style="font-size:0.9rem;color:#888">${executorStr}</div></div>`,
                    start: load.plannedStartTime,
                    end: load.plannedEndTime,
                    title: `${load.title}<br/>${executorStr}`
                };
            })
    );

    return { groups, items };
};

const WorkSchedulePage: React.FC = () => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [epics, setEpics] = useState<WorkEpicEntity[]>([]);
    const [groupsDS, setGroupsDS] = useState<DataSet<DataGroup> | null>(null);
    const [itemsDS, setItemsDS] = useState<DataSet<DataItem> | null>(null);

    useEffect(() => {
        getAllWorkEpics(false).then(data => setEpics(data as WorkEpicEntity[]));
    }, []);

    useEffect(() => {
        if (!timelineRef.current || !epics.length) return;

        const { groups, items } = getTimelineGroupsAndItems(epics);
        const gds = new DataSet<DataGroup>(groups);
        const ids = new DataSet<DataItem>(items);
        setGroupsDS(gds);
        setItemsDS(ids);

        const options: TimelineOptions = {
            stack: false,
            orientation: "top",
            editable: false,
            locale: "zh-tw",
            tooltip: { followMouse: true },
            margin: { item: 10, axis: 5 },
            groupOrder: "content"
        };

        const timeline = new Timeline(timelineRef.current, ids, gds, options);
        return () => timeline.destroy();
    }, [epics]);

    const promptAndRun = (msg: string, action: (input: string) => void) => {
        const input = window.prompt(msg);
        if (input) action(input);
    };

    const handleAddGroup = () => {
        if (!groupsDS) return;
        promptAndRun("請輸入新專案標的名稱：", name => {
            const id = "epic-" + Date.now();
            groupsDS.add({ id, content: `<span style="font-weight:bold">${name}</span>` });
        });
    };

    const handleRemoveGroup = () => {
        if (!groupsDS) return;
        promptAndRun("請輸入要刪除的 epicId：", id => {
            groupsDS.remove(id);
            itemsDS?.forEach(item => item.group === id && itemsDS.remove(item.id as string));
        });
    };

    const handleRenameGroup = () => {
        if (!groupsDS) return;
        promptAndRun("請輸入要改名的 epicId：", id => {
            const group = groupsDS.get(id);
            if (!group) return;
            const oldName = typeof group.content === "string"
                ? group.content.replace(/<[^>]*>/g, "")
                : group.content instanceof HTMLElement ? group.content.textContent ?? "" : "";
            const newName = window.prompt("新名稱：", oldName);
            if (newName) groupsDS.update({ id, content: `<span style="font-weight:bold">${newName}</span>` });
        });
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
                <div ref={timelineRef} className={styles["timeline-container"]} />
            </div>
            <ClientBottomNav />
        </>
    );
};

export default WorkSchedulePage;