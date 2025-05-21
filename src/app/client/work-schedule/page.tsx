"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import React, { useEffect, useReducer, useRef } from "react";
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
    const timelineRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);

    // 取得所有 Epics
    useEffect(() => {
        getAllWorkEpics(false).then((data) => dispatch({ type: "SET_EPICS", payload: data as WorkEpicEntity[] }));
    }, []);

    // 取得所有 WorkLoads
    useEffect(() => {
        getAllWorkLoads(true).then((loads) => {
            dispatch({ type: "SET_WORKLOADS", payload: loads as WorkLoadEntity[] });
        });
    }, []);

    // 產生 vis-timeline 所需的 groups 與 items
    const getTimelineGroupsAndItems = (): { groups: DataGroup[]; items: DataItem[] } => {
        if (!state.epics.length || !state.workLoads.length) return { groups: [], items: [] };
        // Epic 轉 group
        const groups: DataGroup[] = state.epics.map(e => ({
            id: e.epicId,
            content: `<span style="font-weight:bold">${e.title}</span>`,
        }));
        // WorkLoad 轉 item
        const items: DataItem[] = state.workLoads.map(load => {
            // 依據 load 內容對應 Epic
            let epicId: string | number | undefined = undefined;
            // 這邊假設 load 有 epicId，否則用 title 拆法
            if (load.epicId) {
                epicId = load.epicId;
            } else if (load.title) {
                const epicTitle = load.title.split("-")[0].trim();
                const epic = state.epics.find(e => e.title === epicTitle);
                if (epic) epicId = epic.epicId;
            }
            // 顯示 executor
            const executorStr = Array.isArray(load.executor) && load.executor.length > 0
                ? load.executor.join(", ")
                : typeof load.executor === "string" && load.executor
                    ? load.executor
                    : "(無執行者)";
            // 長條顯示 title + executor
            return {
                id: load.loadId,
                group: epicId,
                content: `<div>
          <div style="font-size:1rem;font-weight:600">${load.title || "(無標題)"}</div>
          <div style="font-size:0.9rem;color:#888">${executorStr}</div>
        </div>`,
                start: load.plannedStartTime,
                end: load.plannedEndTime,
                title: `${load.title}<br/>${executorStr}`,
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
                groupOrder: "content", // group 排序
                // 可加入更多 options
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