"use client";

import { getDateRange } from "@/app/actions/workschedule.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import React, { useEffect, useState } from "react";

const WorkSchedulePage: React.FC = () => {
    const [offset, setOffset] = useState(0);
    const [dateRange, setDateRange] = useState<string[]>([]);

    useEffect(() => {
        const fetchDateRange = async () => {
            const dates = await getDateRange(offset);
            setDateRange(dates);
        };
        fetchDateRange();
    }, [offset]);

    return (
        <>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">行事曆</h1>
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setOffset(offset - 7)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        前七天
                    </button>
                    <button
                        onClick={() => setOffset(offset + 7)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        後七天
                    </button>
                </div>
                <div className="grid grid-cols-15 gap-2">
                    {dateRange.map((date: string) => (
                        <div key={date} className="border p-4 text-center">
                            <p className="font-bold">{date}</p>
                            <div className="grid grid-cols-5 gap-1 mt-2">
                                {/* 每天的 5 個格子 */}
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="h-10 border"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <GlobalBottomNav />
        </>
    );
};

export default WorkSchedulePage;
