"use client";

import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { getWorkSchedules } from "@/app/actions/workschedule.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
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
    range: 7,
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

const calculateLabels = (schedules: DailyWorkSchedule[], horizontalAxis: Axis) => {
    const horizontalLabels =
        horizontalAxis === "date"
            ? schedules.map(s => s.date)
            : [...new Set(schedules.flatMap(s => s.assignments.map(a => a.location)))];

    const verticalLabels =
        horizontalAxis === "date"
            ? [...new Set(schedules.flatMap(s => s.assignments.map(a => a.location)))]
            : schedules.map(s => s.date);

    return { horizontalLabels, verticalLabels };
};

const WorkSchedulePage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const updateRange = () => {
            const containerWidth = containerRef.current?.offsetWidth ?? 0;
            const approxCellWidth = 120;
            const maxCols = Math.max(1, Math.floor((containerWidth - 100) / approxCellWidth));
            dispatch({ type: "SET_RANGE", payload: maxCols });
        };

        const observer = new ResizeObserver(updateRange);
        if (containerRef.current) observer.observe(containerRef.current);
        updateRange();

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fetchSchedules = async () => {
            const data = await getWorkSchedules(state.offset, state.range, state.horizontalAxis);
            dispatch({ type: "SET_SCHEDULES", payload: data });
        };
        fetchSchedules();
    }, [state.offset, state.range, state.horizontalAxis]);

    useEffect(() => {
        const fetchWorkLoads = async () => {
            const loads = await getAllWorkLoads(false);
            dispatch({ type: "SET_WORKLOADS", payload: loads as WorkLoadEntity[] });
        };
        fetchWorkLoads();
    }, []);

    const { horizontalLabels, verticalLabels } = calculateLabels(state.schedules, state.horizontalAxis);

    const getAssignment = (date: string, location: string) => {
        const day = state.schedules.find(s => s.date === date);
        return day?.assignments.find(a => a.location === location);
    };

    return (
        <>
            <div className="p-4 overflow-x-auto" ref={containerRef}>
                <h1 className="text-2xl font-bold mb-4">工作排班表</h1>

                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">顯示天數：{state.range}</div>
                    <div>
                        <select
                            className="border px-2 py-1 rounded"
                            value={state.horizontalAxis}
                            onChange={(e) => dispatch({ type: "SET_HORIZONTAL_AXIS", payload: e.target.value as Axis })}
                        >
                            <option value="date">橫向：日期</option>
                            <option value="location">橫向：地點</option>
                        </select>
                    </div>
                </div>

                <table className="min-w-full border border-gray-300 text-sm text-center">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1 whitespace-nowrap">
                                {state.horizontalAxis === "date" ? "地點" : "日期"}
                            </th>
                            {horizontalLabels.map(label => (
                                <th key={label} className="border px-2 py-1 whitespace-nowrap">
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {verticalLabels.map((label) => (
                            <tr key={label}>
                                <td className="border px-2 py-1 font-bold bg-gray-50 whitespace-nowrap">
                                    {label}
                                </td>
                                {horizontalLabels.map((hLabel) => {
                                    const assignment =
                                        state.horizontalAxis === "date"
                                            ? getAssignment(hLabel, label)
                                            : getAssignment(label, hLabel);

                                    return (
                                        <td
                                            key={label + "-" + hLabel}
                                            className="border px-2 py-1 whitespace-nowrap"
                                        >
                                            <div className="font-semibold">{assignment?.groupName ?? "-"}</div>
                                            <div className="text-xs text-gray-600 truncate">
                                                {(assignment?.members ?? []).join("、")}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h2 className="text-xl font-bold mt-8">工作負荷</h2>
                <table className="min-w-full border border-gray-300 text-sm text-center mt-4">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1">負荷ID</th>
                            <th className="border px-2 py-1">任務ID</th>
                            <th className="border px-2 py-1">計劃數量</th>
                            <th className="border px-2 py-1">單位</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.workLoads.map((load, index) => (
                            <tr key={index}>
                                <td>{load.loadId}</td>
                                <td>{load.taskId}</td>
                                <td>{load.plannedQuantity}</td>
                                <td>{load.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                    onClick={() => {
                        const newLoad: WorkLoadEntity = {
                            loadId: `load-${Date.now()}`,
                            taskId: "task-1",
                            plannedQuantity: 10,
                            unit: "件",
                            plannedStartTime: new Date().toISOString(),
                            plannedEndTime: new Date(Date.now() + 3600 * 1000).toISOString(),
                            actualQuantity: 0,
                            executor: "user-1",
                        };
                        dispatch({ type: "SET_WORKLOADS", payload: [...state.workLoads, newLoad] });
                    }}
                >
                    新增工作負載
                </button>
            </div>
            <GlobalBottomNav />
        </>
    );
};

export default WorkSchedulePage;
