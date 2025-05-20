"use client";

import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import React, { useEffect, useState } from "react";

const WorkSchedulePage: React.FC = () => {
    const [workLoads, setWorkLoads] = useState<WorkLoadEntity[]>([]);

    useEffect(() => {
        const fetchWorkLoads = async () => {
            const data = await getAllWorkLoads(false);
            setWorkLoads(data as WorkLoadEntity[]);
        };
        fetchWorkLoads();
    }, []);

    return (
        <main className="pb-16 max-w-lg mx-auto px-4 bg-background text-foreground min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center tracking-wide">所有工作量列表</h1>
            <ul className="space-y-4">
                {workLoads.map(load => (
                    <li key={load.loadId} className="bg-card p-4 rounded-lg shadow">
                        <div className="font-semibold">{load.title}</div>
                        <div>計劃數量：{load.plannedQuantity} {load.unit}</div>
                        <div>實際完成：{load.actualQuantity} {load.unit}</div>
                        <div>執行者：{load.executor}</div>
                        <div>計劃時間：{load.plannedStartTime} ~ {load.plannedEndTime}</div>
                        {load.notes && <div>備註：{load.notes}</div>}
                    </li>
                ))}
            </ul>
            <GlobalBottomNav />
        </main>
    );
};

export default WorkSchedulePage;