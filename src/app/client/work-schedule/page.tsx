import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import React from "react";

const WorkSchedulePage: React.FC = () => {
    const getDateRange = () => {
        const today = new Date();
        const dates = [];
        for (let i = -7; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split("T")[0]); // 格式化為 YYYY-MM-DD
        }
        return dates;
    };

    const dateRange = getDateRange();

    return (
        <>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">行事曆</h1>
                <ul className="list-disc pl-5">
                    {dateRange.map((date) => (
                        <li key={date} className="mb-2">{date}</li>
                    ))}
                </ul>
            </div>
            <GlobalBottomNav />
        </>
    );
};

export default WorkSchedulePage;
