"use client";

import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { getWorkSchedules } from "@/app/actions/workschedule.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import React, { useEffect, useRef, useState } from "react";

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

const WorkSchedulePage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);
    const [range, setRange] = useState(7);
    const [schedules, setSchedules] = useState<DailyWorkSchedule[]>([]);
    const [workLoads, setWorkLoads] = useState<WorkLoadEntity[]>([]);
    const [horizontalAxis, setHorizontalAxis] = useState<Axis>("date");

    useEffect(() => {
        const updateRange = () => {
            const containerWidth = containerRef.current?.offsetWidth ?? 0;
            const approxCellWidth = 120;
            const maxCols = Math.max(1, Math.floor((containerWidth - 100) / approxCellWidth));
            setRange(maxCols);
        };

        const observer = new ResizeObserver(updateRange);
        if (containerRef.current) observer.observe(containerRef.current);
        updateRange();

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fetch = async () => {
            const data = await getWorkSchedules(offset, range, horizontalAxis);
            setSchedules(data);
        };
        fetch();
    }, [offset, range, horizontalAxis]);

    useEffect(() => {
        const fetchWorkLoads = async () => {
            const loads = await getAllWorkLoads(false);
            setWorkLoads(loads as WorkLoadEntity[]);
        };
        fetchWorkLoads();
    }, []);

    const renderWorkLoads = () => {
        return workLoads.map((load, index) => (
            <tr key={index}>
                <td>{load.loadId}</td>
                <td>{load.taskId}</td>
                <td>{load.plannedQuantity}</td>
                <td>{load.unit}</td>
            </tr>
        ));
    };

    const handleAddWorkLoad = () => {
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
        setWorkLoads(prev => [...prev, newLoad]);
    };

    // 橫軸：依據 horizontalAxis 決定橫向資料是日期還是地點
    const horizontalLabels =
        horizontalAxis === "date"
            ? schedules.map(s => s.date)
            : [...new Set(schedules.flatMap(s => s.assignments.map(a => a.location)))];

    // 縱軸：如果橫軸是日期，縱軸為地點；反之為日期
    const verticalLabels =
        horizontalAxis === "date"
            ? [...new Set(schedules.flatMap(s => s.assignments.map(a => a.location)))]
            : schedules.map(s => s.date);

    const getAssignment = (date: string, location: string) => {
        const day = schedules.find(s => s.date === date);
        return day?.assignments.find(a => a.location === location);
    };

    return (
        <>
            <div className="p-4 overflow-x-auto" ref={containerRef}>
                <h1 className="text-2xl font-bold mb-4">工作排班表</h1>

                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setOffset(offset - range)}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            前 {range} 天
                        </button>
                        <button
                            onClick={() => setOffset(offset + range)}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            後 {range} 天
                        </button>
                    </div>
                    <div className="text-sm text-gray-600">
                        顯示天數：{range}
                    </div>
                    <div>
                        <select
                            className="border px-2 py-1 rounded"
                            value={horizontalAxis}
                            onChange={(e) => setHorizontalAxis(e.target.value as Axis)}
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
                                {horizontalAxis === "date" ? "地點" : "日期"}
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
                                        horizontalAxis === "date"
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
                        {renderWorkLoads()}
                    </tbody>
                </table>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                    onClick={handleAddWorkLoad}
                >
                    新增工作負載
                </button>
            </div>
            <GlobalBottomNav />
        </>
    );
};

export default WorkSchedulePage;
