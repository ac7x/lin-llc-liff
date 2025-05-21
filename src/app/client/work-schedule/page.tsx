"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import React, { useEffect, useReducer, useRef } from "react";
// 新增 vis-timeline 相關 import
import { DataGroup, DataItem, DataSet, Timeline, TimelineOptions } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

type State = {
    workLoads: WorkLoadEntity[];
    epics: WorkEpicEntity[];
};

type Action =
    | { type: "SET_WORKLOADS"; payload: WorkLoadEntity[] }
    | { type: "SET_EPICS"; payload: WorkEpicEntity[] };

const initialState: State = {
    workLoads: [],
    epics: [],
};

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "SET_WORKLOADS":
            return { ...state, workLoads: action.payload };
        case "SET_EPICS":
            return { ...state, epics: action.payload };
        default:
            return state;
    }
};

const WorkSchedulePage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        getAllWorkEpics(false).then((data) => dispatch({ type: "SET_EPICS", payload: data as WorkEpicEntity[] }));
    }, []);

    useEffect(() => {
        getAllWorkLoads(true).then((loads) => {
            dispatch({ type: "SET_WORKLOADS", payload: loads as WorkLoadEntity[] });
        });
    }, []);

    // vis-timeline groups/items 轉換
    const getTimelineGroupsAndItems = (): { groups: DataGroup[]; items: DataItem[] } => {
        if (!state.epics.length || !state.workLoads.length) return { groups: [], items: [] };
        // 用 epicId 當 group id，content 用 title
        const groups: DataGroup[] = state.epics.map(e => ({
            id: e.epicId,
            content: e.title
        }));
        // item 的 group 要對應 epicId
        const items: DataItem[] = state.workLoads.map(load => {
            // 從 load.title 拆出 epic title，再找對應 epicId
            const epicTitle = load.title?.split("-")[0] || "";
            const epic = state.epics.find(e => e.title === epicTitle);
            return {
                id: load.loadId,
                group: epic ? epic.epicId : undefined,
                content: load.title,
                start: load.plannedStartTime,
                end: load.plannedEndTime,
                title: [
                    load.title,
                    Array.isArray(load.executor) && load.executor.length > 0
                        ? load.executor.join(", ")
                        : typeof load.executor === "string" && load.executor
                            ? load.executor
                            : "(無執行者)"
                ].join("<br/>")
            };
        });
        return { groups, items };
    };

    // 初始化與更新 vis-timeline
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
            } as TimelineOptions
        );

        return () => {
            timeline.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.epics, state.workLoads]);

    return (
        <>
            <div
                ref={containerRef}
                className="border border-gray-300 dark:border-neutral-700 rounded-lg p-4 m-4"
            >
                <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
                {/* vis-timeline 容器 */}
                <div ref={timelineRef} style={{ height: 400, minHeight: 300 }} />
            </div>
            <ClientBottomNav />
        </>
    );
};

export default WorkSchedulePage;