"use client";

import { getWorkSchedules } from "@/app/actions/workschedule.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import React, { useEffect, useState } from "react";

type WorkAssignment = {
    location: string;
    groupName: string;
    members: string[];
};

type DailyWorkSchedule = {
    date: string;
    assignments: WorkAssignment[];
};

function getRecommendedRangeByWidth(width: number): number {
    if (width < 480) return 3;       // 手機
    if (width < 768) return 5;       // 平板
    return 7;                        // 桌機
}

const WorkSchedulePage: React.FC = () => {
    const [offset, setOffset] = useState(0);
    const [range, setRange] = useState(7);
    const [schedules, setSchedules] = useState<DailyWorkSchedule[]>([]);

    useEffect(() => {
        const handleResize = () => {
            setRange(getRecommendedRangeByWidth(window.innerWidth));
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetch = async () => {
            const data = await getWorkSchedules(offset, range);
            setSchedules(data);
        };
        fetch();
    }, [offset, range]);

    const locationList = schedules[0]?.assignments.map(a => a.location) ?? [];

    return (
        <>
            <div className="p-4 overflow-x-auto">
                <h1 className="text-2xl font-bold mb-4">工作排班表</h1>
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setOffset(offset - range)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        前 {range} 天
                    </button>
                    <span className="text-gray-600 text-sm">顯示天數：{range}</span>
                    <button
                        onClick={() => setOffset(offset + range)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        後 {range} 天
                    </button>
                </div>

                <table className="min-w-full border border-gray-300 text-sm text-center">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1">地點</th>
                            {schedules.map(schedule => (
                                <th key={schedule.date} className="border px-2 py-1">
                                    {schedule.date}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {locationList.map(location => (
                            <tr key={location}>
                                <td className="border px-2 py-1 font-bold bg-gray-50">{location}</td>
                                {schedules.map(schedule => {
                                    const assign = schedule.assignments.find(a => a.location === location);
                                    return (
                                        <td key={schedule.date + location} className="border px-2 py-1">
                                            <div className="font-semibold">{assign?.groupName ?? "-"}</div>
                                            <div className="text-xs text-gray-600 truncate">
                                                {(assign?.members ?? []).join("、")}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <GlobalBottomNav />
        </>
    );
};

export default WorkSchedulePage;
