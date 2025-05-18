"use client";

import { addWorkEpic, getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { useEffect, useState } from "react";

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [newEpicTitle, setNewEpicTitle] = useState("");

    useEffect(() => {
        const fetchWorkEpics = async () => {
            const epics = await getAllWorkEpics(false); // 使用 false 表示實體階段
            setWorkEpics(epics as WorkEpicEntity[]);
        };
        fetchWorkEpics();
    }, []);

    const handleAddEpic = async () => {
        if (!newEpicTitle.trim()) {
            alert("請輸入標的標題！");
            return;
        }

        const newEpic: WorkEpicEntity = {
            epicId: `epic-${Date.now()}`,
            title: newEpicTitle,
            startDate: "",
            endDate: "",
            insuranceStatus: "無",
            owner: "未指定",
            status: "待開始",
            priority: 1,
            region: "北部", // 預設區域
            address: "未指定", // 預設地址
            createdAt: new Date().toISOString() // 新增 createdAt 屬性
        };

        await addWorkEpic(newEpic);
        setWorkEpics(prev => [...prev, newEpic]);
        setNewEpicTitle("");
    };

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作標的列表</h1>

                {/* 新增標的區域 */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={newEpicTitle}
                        onChange={e => setNewEpicTitle(e.target.value)}
                        placeholder="輸入新標的標題"
                        className="border p-2 mr-2"
                    />
                    <button
                        onClick={handleAddEpic}
                        className="bg-blue-500 text-white px-4 py-2"
                    >
                        建立標的
                    </button>
                </div>

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
                                <td className="border border-gray-300 px-4 py-2">{epic.region} - {epic.address}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <GlobalBottomNav />
        </>
    );
}