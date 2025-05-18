"use client";

import { getAllWorkEpics, WorkEpic } from "@/app/actions/workepic.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { useEffect, useState } from "react";

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpic[]>([]);

    useEffect(() => {
        const fetchWorkEpics = async () => {
            const epics = await getAllWorkEpics();
            setWorkEpics(epics);
        };
        fetchWorkEpics();
    }, []);

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作標的列表</h1>
                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 px-4 py-2">標題</th>
                            <th className="border border-gray-300 px-4 py-2">開始時間</th>
                            <th className="border border-gray-300 px-4 py-2">結束時間</th>
                            <th className="border border-gray-300 px-4 py-2">保險狀態</th>
                            <th className="border border-gray-300 px-4 py-2">負責人</th>
                            <th className="border border-gray-300 px-4 py-2">狀態</th>
                            <th className="border border-gray-300 px-4 py-2">優先級</th>
                            <th className="border border-gray-300 px-4 py-2">地點</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workEpics.map(epic => (
                            <tr key={epic.epicId}>
                                <td className="border border-gray-300 px-4 py-2">{epic.title}</td>
                                <td className="border border-gray-300 px-4 py-2">{epic.startDate}</td>
                                <td className="border border-gray-300 px-4 py-2">{epic.endDate}</td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {epic.insuranceStatus === "有" ? `有 (${epic.insuranceDate || "未提供"})` : "無"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">{epic.owner}</td>
                                <td className="border border-gray-300 px-4 py-2">{epic.status}</td>
                                <td className="border border-gray-300 px-4 py-2">{epic.priority}</td>
                                <td className="border border-gray-300 px-4 py-2">{epic.location}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <GlobalBottomNav />
        </>
    );
}