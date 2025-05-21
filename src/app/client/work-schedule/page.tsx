"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { WorkLoadEntity } from "@/app/actions/workload.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import React, { useEffect, useReducer, useRef } from "react";
import { DataGroup, DataItem, DataSet, Timeline, TimelineOptions } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

// 狀態類型
type State = {
    epics: WorkEpicEntity[];
};

type Action = { type: "SET_EPICS"; payload: WorkEpicEntity[] };

const initialState: State = {
    epics: [],
};

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "SET_EPICS":
            return { ...state, epics: action.payload };
        default:
            return state;
    }
};

const WorkSchedulePage: React.FC = () => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);

    // 取得全部 Epics（含 workLoads）
    useEffect(() => {
        getAllWorkEpics(false).then((data) =>
            dispatch({ type: "SET_EPICS", payload: data as WorkEpicEntity[] })
        );
    }, []);

    // 組 groups/items
    const getTimelineGroupsAndItems = (): { groups: DataGroup[]; items: DataItem[] } => {
        if (!state.epics.length) return { groups: [], items: [] };
        // groups: 每個 epic 一個 group
        const groups: DataGroup[] = state.epics.map((e) => ({
            id: e.epicId,
            content: `<span style="font-weight:bold">${e.title}</span>`,
        }));
        // items: 把每個 epic 的 workLoads 展平
        const items: DataItem[] = state.epics.flatMap((epic) =>
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
                    title: `${load.title}<br/>${executorStr}`,
                };
            })
        );
        return { groups, items };
    };

    // 初始化 & 更新 timeline
    useEffect(() => {
        if (!timelineRef.current) return;
        const { groups, items } = getTimelineGroupsAndItems();
        if (!groups.length || !items.length) return;

        const timeline = new Timeline(
            timelineRef.current,
            new DataSet(items),
            new DataSet(groups),
            {
                stack: false,
                orientation: "top",
                editable: false,
                locale: "zh-tw",
                tooltip: { followMouse: true },
                margin: { item: 10, axis: 5 },
                groupOrder: "content",
            } as TimelineOptions
        );

        return () => {
            timeline.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.epics]);

    return (
        <>
            <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-4 m-4">
                <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
                {/* vis-timeline 容器 */}
                <div ref={timelineRef} style={{ height: 400, minHeight: 300 }} />
            </div>
            <ClientBottomNav />
        </>
    );
};

export default WorkSchedulePage;