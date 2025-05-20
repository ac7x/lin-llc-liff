"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { getWorkSchedules } from "@/app/actions/workschedule.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import React, { useEffect, useReducer, useRef } from "react";

type WorkAssignment = {
    location: string;
    groupName: string;
    members: string[];
};

type DailyWorkSchedule = {
    date: string;
    assignments: WorkAssignment[];
};

type Axis = "date" | "location";

type State = {
    offset: number;
    range: number;
    schedules: DailyWorkSchedule[];
    workLoads: WorkLoadEntity[];
    horizontalAxis: Axis;
};

type Action =
    | { type: "SET_OFFSET"; payload: number }
    | { type: "SET_RANGE"; payload: number }
    | { type: "SET_SCHEDULES"; payload: DailyWorkSchedule[] }
    | { type: "SET_WORKLOADS"; payload: WorkLoadEntity[] }
    | { type: "SET_HORIZONTAL_AXIS"; payload: Axis };

const initialState: State = {
    offset: 0,
    range: 7, // 預設顯示七天
    schedules: [],
    workLoads: [],
    horizontalAxis: "date",
};

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "SET_OFFSET":
            return { ...state, offset: action.payload };
        case "SET_RANGE":
            return { ...state, range: action.payload };
        case "SET_SCHEDULES":
            return { ...state, schedules: action.payload };
        case "SET_WORKLOADS":
            return { ...state, workLoads: action.payload };
        case "SET_HORIZONTAL_AXIS":
            return { ...state, horizontalAxis: action.payload };
        default:
            return state;
    }
};

const WorkSchedulePage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);
    const [epics, setEpics] = React.useState<WorkEpicEntity[]>([]);
    const hasAutoSetRange = useRef(false);

    // 取得所有標的（epic）
    useEffect(() => {
        getAllWorkEpics(false).then(data => setEpics(data as WorkEpicEntity[]));
    }, []);

    // 只在初次載入時根據容器寬度自動調整 range
    useEffect(() => {
        if (hasAutoSetRange.current) return;
        const updateRange = () => {
            const width = containerRef.current?.offsetWidth ?? 0;
            const maxCols = Math.max(1, Math.floor((width - 100) / 120));
            dispatch({ type: "SET_RANGE", payload: maxCols });
            hasAutoSetRange.current = true;
        };
        const observer = new ResizeObserver(updateRange);
        if (containerRef.current) observer.observe(containerRef.current);
        updateRange();
        return () => observer.disconnect();
    }, []);

    // 取得排班資料
    useEffect(() => {
        getWorkSchedules(state.offset, state.range, state.horizontalAxis).then(data => {
            dispatch({ type: "SET_SCHEDULES", payload: data });
        });
    }, [state.offset, state.range, state.horizontalAxis]);

    // 取得工作量資料
    useEffect(() => {
        getAllWorkLoads(true).then(loads => {
            dispatch({ type: "SET_WORKLOADS", payload: loads as WorkLoadEntity[] });
        });
    }, []);

    // 調整 calculateLabels 以 epic 為主
    const calculateLabels = (schedules: DailyWorkSchedule[], horizontalAxis: Axis) => {
        if (!schedules.length || !epics.length) return { horizontalLabels: [], verticalLabels: [] };
        if (horizontalAxis === "date") {
            const horizontalLabels = schedules.map(s => s.date);
            const verticalLabels = epics.map(e => e.title); // 以 epic title 為地點
            return { horizontalLabels, verticalLabels };
        } else {
            const horizontalLabels = epics.map(e => e.title);
            const verticalLabels = schedules.map(s => s.date);
            return { horizontalLabels, verticalLabels };
        }
    };

    const { horizontalLabels, verticalLabels } = calculateLabels(state.schedules, state.horizontalAxis);

    // 根據日期找出對應的工作量（不再比對 epicTitle）
    const getLoadsForCell = (date: string) => {
        return state.workLoads.filter(l => {
            const matchDate = l.plannedStartTime && l.plannedStartTime.startsWith(date);
            return matchDate;
        });
    };

    return (
        <>
            <div
                ref={containerRef}
                className="border border-gray-300 dark:border-neutral-700 rounded-lg p-4 m-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            >
                <h1 className="text-2xl font-bold mb-4">工作排班表</h1>

                <div className="mb-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span>顯示天數：</span>
                        <input
                            type="number"
                            min={1}
                            max={31}
                            value={state.range}
                            onChange={e => dispatch({ type: "SET_RANGE", payload: Number(e.target.value) })}
                            className="border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1 w-20"
                        />
                    </div>
                    <div>
                        <select
                            value={state.horizontalAxis}
                            onChange={e => dispatch({ type: "SET_HORIZONTAL_AXIS", payload: e.target.value as Axis })}
                            className="border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1"
                        >
                            <option value="date">橫向：日期</option>
                            <option value="location">橫向：標的</option>
                        </select>
                    </div>
                </div>

                <table className="table-auto w-full mb-6 border-collapse bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    <thead>
                        <tr>
                            <th className="border px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                                {state.horizontalAxis === "date" ? "標的" : "日期"}
                            </th>
                            {horizontalLabels.map(label => (
                                <th key={label} className="border px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {verticalLabels.map(vLabel => (
                            <tr key={vLabel} className="even:bg-gray-50 dark:even:bg-neutral-800">
                                <td className="border px-2 py-1 font-bold">{vLabel}</td>
                                {horizontalLabels.map(hLabel => {
                                    // 只根據日期比對
                                    const date = state.horizontalAxis === "date" ? hLabel : vLabel;
                                    const loads = getLoadsForCell(date);
                                    return (
                                        <td key={hLabel} className="border px-2 py-1 align-top">
                                            {loads.length > 0 ? (
                                                <ul className="mt-1 text-xs">
                                                    {loads.map(load => (
                                                        <li key={load.loadId} className="mb-1">
                                                            <div>工作量：{load.title}</div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <span className="text-gray-400">無工作量</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ClientBottomNav />
        </>
    );
};

export default WorkSchedulePage;