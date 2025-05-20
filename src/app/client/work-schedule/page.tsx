"use client";

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
    if (!schedules.length) return { horizontalLabels: [], verticalLabels: [] };
    if (horizontalAxis === "date") {
        const horizontalLabels = schedules.map(s => s.date);
        const verticalLabels = Array.from(new Set(schedules.flatMap(s => s.assignments.map(a => a.location))));
        return { horizontalLabels, verticalLabels };
    } else {
        const horizontalLabels = Array.from(new Set(schedules.flatMap(s => s.assignments.map(a => a.location))));
        const verticalLabels = schedules.map(s => s.date);
        return { horizontalLabels, verticalLabels };
    }
};

const WorkSchedulePage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);

    // 自動根據容器寬度調整 range
    useEffect(() => {
        const updateRange = () => {
            const width = containerRef.current?.offsetWidth ?? 0;
            const maxCols = Math.max(1, Math.floor((width - 100) / 120));
            dispatch({ type: "SET_RANGE", payload: maxCols });
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

    const { horizontalLabels, verticalLabels } = calculateLabels(state.schedules, state.horizontalAxis);

    const getAssignment = (date: string, location: string) => {
        const day = state.schedules.find(s => s.date === date);
        return day?.assignments.find(a => a.location === location);
    };

    const tableStyle = {
        borderCollapse: "collapse" as const,
        width: "100%",
        marginBottom: 24,
    };

    const cellStyle = {
        border: "1px solid #888",
        padding: 8,
    };

    const headerStyle = {
        ...cellStyle,
        background: "#f5f5f5",
    };

    return (
        <>
            <div
                ref={containerRef}
                style={{
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    padding: 16,
                    margin: 16,
                }}
            >
                <h1>工作排班表</h1>

                <div>
                    <div>顯示天數：{state.range}</div>
                    <div>
                        <select
                            value={state.horizontalAxis}
                            onChange={e => dispatch({ type: "SET_HORIZONTAL_AXIS", payload: e.target.value as Axis })}
                        >
                            <option value="date">橫向：日期</option>
                            <option value="location">橫向：地點</option>
                        </select>
                    </div>
                </div>

                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={headerStyle}>
                                {state.horizontalAxis === "date" ? "地點" : "日期"}
                            </th>
                            {horizontalLabels.map(label => (
                                <th key={label} style={headerStyle}>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {verticalLabels.map(label => (
                            <tr key={label}>
                                <td style={cellStyle}>{label}</td>
                                {horizontalLabels.map(hLabel => {
                                    const assignment =
                                        state.horizontalAxis === "date"
                                            ? getAssignment(hLabel, label)
                                            : getAssignment(label, hLabel);
                                    return (
                                        <td key={label + "-" + hLabel} style={cellStyle}>
                                            <div>{assignment?.groupName ?? "-"}</div>
                                            <div>{(assignment?.members ?? []).join("、")}</div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h2>工作負荷</h2>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={headerStyle}>負荷ID</th>
                            <th style={headerStyle}>任務ID</th>
                            <th style={headerStyle}>計劃數量</th>
                            <th style={headerStyle}>單位</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.workLoads.map((load, index) => (
                            <tr key={index}>
                                <td style={cellStyle}>{load.loadId}</td>
                                <td style={cellStyle}>{load.taskId}</td>
                                <td style={cellStyle}>{load.plannedQuantity}</td>
                                <td style={cellStyle}>{load.unit}</td>
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