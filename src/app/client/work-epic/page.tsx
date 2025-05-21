"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { getAllWorkTasks, WorkTaskEntity } from "@/app/actions/worktask.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import { useEffect, useState } from "react";

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);

    useEffect(() => {
        const fetchWorkEpics = async () => {
            const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
            const allTasks = await getAllWorkTasks(false) as WorkTaskEntity[];
            const epicsWithTasks = epics.map(epic => ({
                ...epic,
                workTasks: allTasks.filter(task => task.flowId && epic.workTasks && epic.workTasks.some(t => t.taskId === task.taskId) ? true : false)
            }));
            setWorkEpics(epicsWithTasks);
        };
        fetchWorkEpics();
    }, []);

    const getEpicProgress = (epic: WorkEpicEntity) => {
        let total = 0;
        let completed = 0;
        if (epic.workTasks) {
            epic.workTasks.forEach(task => {
                total += task.targetQuantity;
                completed += task.completedQuantity;
            });
        }
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { percent, completed, total };
    };

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作標的列表</h1>

                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 px-4 py-2">標題 / 進度</th>
                            <th className="border border-gray-300 px-4 py-2">開始時間</th>
                            <th className="border border-gray-300 px-4 py-2">結束時間</th>
                            <th className="border border-gray-300 px-4 py-2">保險狀態</th>
                            <th className="border border-gray-300 px-4 py-2">負責人</th>
                            <th className="border border-gray-300 px-4 py-2">監工</th>
                            <th className="border border-gray-300 px-4 py-2">安全衛生人員</th>
                            <th className="border border-gray-300 px-4 py-2">狀態</th>
                            <th className="border border-gray-300 px-4 py-2">優先級</th>
                            <th className="border border-gray-300 px-4 py-2">地點</th>
                            <th className="border border-gray-300 px-4 py-2">地址</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workEpics.map(epic => {
                            const progress = getEpicProgress(epic);
                            return (
                                <tr key={epic.epicId}>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{epic.title}</span>
                                            <span className="text-xs text-gray-500">({progress.completed}/{progress.total}，{progress.percent}%)</span>
                                            <div className="w-full h-2 bg-gray-200 rounded mt-1">
                                                <div
                                                    className="h-2 bg-blue-500 rounded"
                                                    style={{ width: `${progress.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.startDate}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.endDate}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.insuranceStatus || "無"}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.owner?.name || "未指定"}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.siteSupervisors?.map(s => s.name).join('、') || "-"}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.safetyOfficers?.map(s => s.name).join('、') || "-"}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.status}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.priority}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.region}</td>
                                    <td className="border border-gray-300 px-4 py-2">{epic.address}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </main>
            <ClientBottomNav />
        </>
    );
}