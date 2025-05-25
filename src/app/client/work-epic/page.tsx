"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import { useEffect, useState } from "react";

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);

    useEffect(() => {
        const fetchWorkEpics = async () => {
            const epics = (await getAllWorkEpics(false)) as WorkEpicEntity[];
            setWorkEpics(epics);
        };
        fetchWorkEpics();
    }, []);

    const getEpicProgress = (epic: WorkEpicEntity) => {
        let total = 0, completed = 0;
        if (epic.workTasks) {
            epic.workTasks.forEach((task) => {
                total += task.targetQuantity;
                completed += task.completedQuantity;
            });
        }
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { percent, completed, total };
    };

    return (
        <>
            <main className="p-4 bg-white dark:bg-gray-900 min-h-screen">
                <h1 className="text-2xl font-bold mb-4 text-center md:text-left text-gray-900 dark:text-gray-100">
                    工作標的列表
                </h1>
                <div className="flex flex-wrap gap-4 justify-center">
                    {workEpics.map((epic) => {
                        const progress = getEpicProgress(epic);
                        return (
                            <div
                                key={epic.epicId}
                                className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 p-4 shadow-sm flex flex-col"
                            >
                                <div className="flex flex-col gap-1 mb-2">
                                    <span className="font-semibold text-base text-gray-900 dark:text-gray-100">{epic.title}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">（{progress.percent}％）</span>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded">
                                        <div
                                            className="h-2 bg-blue-500 dark:bg-blue-400 rounded"
                                            style={{ width: `${progress.percent}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-900 dark:text-gray-100">
                                    <span className="text-gray-500 dark:text-gray-400">開始時間：</span>
                                    <span>{epic.startDate}</span>
                                    <span className="text-gray-500 dark:text-gray-400">結束時間：</span>
                                    <span>{epic.endDate}</span>
                                    <span className="text-gray-500 dark:text-gray-400">保險狀態：</span>
                                    <span>{epic.insuranceStatus || "無"}</span>
                                    <span className="text-gray-500 dark:text-gray-400">負責人：</span>
                                    <span>{epic.owner?.name || "未指定"}</span>
                                    <span className="text-gray-500 dark:text-gray-400">監工：</span>
                                    <span>
                                        {epic.siteSupervisors?.map((s) => s.name).join("、") || "-"}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">安全衛生人員：</span>
                                    <span>
                                        {epic.safetyOfficers?.map((s) => s.name).join("、") || "-"}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">狀態：</span>
                                    <span>{epic.status}</span>
                                    <span className="text-gray-500 dark:text-gray-400">優先級：</span>
                                    <span>{epic.priority}</span>
                                    <span className="text-gray-500 dark:text-gray-400">地點：</span>
                                    <span>{epic.region}</span>
                                    <span className="text-gray-500 dark:text-gray-400">地址：</span>
                                    <span>
                                        {epic.address}
                                        {epic.address && (
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(epic.address)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-2 text-blue-600 dark:text-blue-400 underline"
                                            >
                                                導航
                                            </a>
                                        )}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">工作區：</span>
                                    <span>
                                        {Array.isArray(epic.workZones) && epic.workZones.length > 0
                                            ? epic.workZones.map((z) => z.title).join(", ")
                                            : "-"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
            <ClientBottomNav />
        </>
    );
}