"use client";

import { getAllWorkEpics, WorkEpicEntity } from "@/app/actions/workepic.action";
import type { WorkFlowEntity } from "@/app/actions/workflow.action";
import { WorkLoadEntity } from "@/app/actions/workload.action";
import { getAllWorkTasks, WorkTaskEntity } from "@/app/actions/worktask.action";
import { getAllWorkTypes, WorkTypeEntity } from "@/app/actions/worktype.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import { useEffect, useState } from "react";

export default function WorkTaskPage() {
  const [tasks, setTasks] = useState<WorkTaskEntity[]>([]);
  const [workloads, setWorkloads] = useState<WorkLoadEntity[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkTypeEntity[]>([]);
  const [epics, setEpics] = useState<WorkEpicEntity[]>([]);
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");

  useEffect(() => {
    getAllWorkTasks().then(data => setTasks(data as WorkTaskEntity[]));
    getAllWorkTypes(true).then(data => setWorkTypes(data as WorkTypeEntity[]));
    getAllWorkEpics(false).then(data => {
      const epicArr = data as WorkEpicEntity[];
      setEpics(epicArr);
      const allLoads = epicArr.flatMap(e => Array.isArray(e.workLoads) ? e.workLoads : []);
      setWorkloads(allLoads);
    });
  }, []);

  // 將所有 workType 的 flows 合併成一個陣列
  const allFlows: WorkFlowEntity[] = workTypes.flatMap(t => t.flows || []);

  const selectedEpic = epics.find(e => e.epicId === selectedEpicId);
  const epicTitle = selectedEpic?.title;
  const filteredTasks = selectedEpicId
    ? tasks.filter(task => epicTitle && task.title.startsWith(epicTitle))
    : tasks;

  return (
    <>
      <main className="p-4 max-w-screen-lg mx-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">工作任務與工作負載</h1>
        <div className="mb-4">
          <select
            className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={selectedEpicId}
            onChange={e => setSelectedEpicId(e.target.value)}
          >
            <option value="">全部標的</option>
            {epics.map(epic => (
              <option key={epic.epicId} value={epic.epicId}>{epic.title}</option>
            ))}
          </select>
        </div>

        {/* 桌面版表格 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300 dark:border-gray-700 mb-8">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border border-gray-300 dark:border-gray-700 px-2 py-1">任務名稱</th>
                <th className="border border-gray-300 dark:border-gray-700 px-2 py-1">流程步驟</th>
                <th className="border border-gray-300 dark:border-gray-700 px-2 py-1">目標數量</th>
                <th className="border border-gray-300 dark:border-gray-700 px-2 py-1">單位</th>
                <th className="border border-gray-300 dark:border-gray-700 px-2 py-1">已完成數量</th>
                <th className="border border-gray-300 dark:border-gray-700 px-2 py-1">狀態</th>
                <th className="border border-gray-300 dark:border-gray-700 px-2 py-1">工作區</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredTasks]
                .sort((a, b) => {
                  const flowA = allFlows.find(f => f.flowId === a.flowId)
                  const flowB = allFlows.find(f => f.flowId === b.flowId)
                  const orderA = flowA?.steps?.[0]?.order ?? 0
                  const orderB = flowB?.steps?.[0]?.order ?? 0
                  return orderA - orderB
                })
                .map(task => {
                  const flow = allFlows.find(f => f.flowId === task.flowId);
                  const orderedSteps = flow?.steps?.slice().sort((a: WorkFlowEntity['steps'][number], b: WorkFlowEntity['steps'][number]) => a.order - b.order) || [];
                  const stepName = orderedSteps[0]?.stepName || task.flowId;
                  const relatedLoads = workloads.filter(load => load.taskId === task.taskId);

                  return (
                    <tr key={task.taskId} className="even:bg-gray-50 dark:even:bg-gray-800">
                      <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 align-top">
                        <div className="font-semibold">{task.title}</div>
                        {relatedLoads.length > 0 && (
                          <table className="mt-2 table-auto w-full border-collapse border border-gray-200 dark:border-gray-600 text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                              <tr>
                                <th className="border border-gray-200 dark:border-gray-600 px-2 py-1">工作量名稱</th>
                                <th className="border border-gray-200 dark:border-gray-600 px-2 py-1">計畫數量</th>
                                <th className="border border-gray-200 dark:border-gray-600 px-2 py-1">單位</th>
                                <th className="border border-gray-200 dark:border-gray-600 px-2 py-1">計畫開始</th>
                                <th className="border border-gray-200 dark:border-gray-600 px-2 py-1">計畫結束</th>
                                <th className="border border-gray-200 dark:border-gray-600 px-2 py-1">完成數量</th>
                                <th className="border border-gray-200 dark:border-gray-600 px-2 py-1">執行者</th>
                                <th className="border border-gray-200 dark:border-gray-600 px-2 py-1">備註</th>
                              </tr>
                            </thead>
                            <tbody>
                              {relatedLoads.map(load => (
                                <tr key={load.loadId} className="even:bg-gray-50 dark:even:bg-gray-700">
                                  <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">{load.title || load.loadId}</td>
                                  <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">{load.plannedQuantity}</td>
                                  <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">{load.unit}</td>
                                  <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">{load.plannedStartTime?.slice(0, 10) || ""}</td>
                                  <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">{load.plannedEndTime?.slice(0, 10) || ""}</td>
                                  <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">{load.actualQuantity}</td>
                                  <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">{Array.isArray(load.executor) ? load.executor.join("、") : ""}</td>
                                  <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">{load.notes || ""}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 align-top">{stepName}</td>
                      <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 align-top">{task.targetQuantity}</td>
                      <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 align-top">{task.unit}</td>
                      <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 align-top">{task.completedQuantity}</td>
                      <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 align-top">{task.status}</td>
                      <td className="border border-gray-300 dark:border-gray-700 px-2 py-1">
                        {(() => {
                          const epic = epics.find(e => e.workTasks && e.workTasks.some(t => t.taskId === task.taskId));
                          if (epic && Array.isArray(epic.workZones) && epic.workZones.length > 0) {
                            return epic.workZones.map(z => z.title).join(', ');
                          }
                          return '-';
                        })()}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* 行動裝置卡片版 */}
        <div className="md:hidden flex flex-col gap-4">
          {[...filteredTasks]
            .sort((a, b) => {
              const flowA = allFlows.find(f => f.flowId === a.flowId)
              const flowB = allFlows.find(f => f.flowId === b.flowId)
              const orderA = flowA?.steps?.[0]?.order ?? 0
              const orderB = flowB?.steps?.[0]?.order ?? 0
              return orderA - orderB
            })
            .map(task => {
              const flow = allFlows.find(f => f.flowId === task.flowId);
              const orderedSteps = flow?.steps?.slice().sort((a: WorkFlowEntity['steps'][number], b: WorkFlowEntity['steps'][number]) => a.order - b.order) || [];
              const stepName = orderedSteps[0]?.stepName || task.flowId;
              const relatedLoads = workloads.filter(load => load.taskId === task.taskId);

              return (
                <div key={task.taskId} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-3">
                  <div className="font-semibold text-base mb-1">{task.title}</div>
                  <div className="flex flex-wrap text-sm mb-2 text-gray-900 dark:text-gray-100">
                    <div className="mr-4 mb-1"><span className="font-medium">流程步驟：</span>{stepName}</div>
                    <div className="mr-4 mb-1"><span className="font-medium">目標數量：</span>{task.targetQuantity}</div>
                    <div className="mr-4 mb-1"><span className="font-medium">單位：</span>{task.unit}</div>
                    <div className="mr-4 mb-1"><span className="font-medium">已完成：</span>{task.completedQuantity}</div>
                    <div className="mr-4 mb-1"><span className="font-medium">狀態：</span>{task.status}</div>
                    <div className="mr-4 mb-1"><span className="font-medium">工作區：</span>
                      {(() => {
                        const epic = epics.find(e => e.workTasks && e.workTasks.some(t => t.taskId === task.taskId));
                        if (epic && Array.isArray(epic.workZones) && epic.workZones.length > 0) {
                          return epic.workZones.map(z => z.title).join(', ');
                        }
                        return '-';
                      })()}
                    </div>
                  </div>
                  {relatedLoads.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="table-auto w-full border-collapse border border-gray-200 dark:border-gray-600 text-xs text-gray-900 dark:text-gray-100">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">工作量名稱</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">計畫數量</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">單位</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">計畫開始</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">計畫結束</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">完成數量</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">執行者</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">備註</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatedLoads.map(load => (
                            <tr key={load.loadId} className="even:bg-gray-50 dark:even:bg-gray-700">
                              <td className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">{load.title || load.loadId}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">{load.plannedQuantity}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">{load.unit}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">{load.plannedStartTime?.slice(0, 10) || ""}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">{load.plannedEndTime?.slice(0, 10) || ""}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">{load.actualQuantity}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">{Array.isArray(load.executor) ? load.executor.join("、") : ""}</td>
                              <td className="border border-gray-200 dark:border-gray-600 px-1 py-0.5">{load.notes || ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </main>
      <ClientBottomNav />
    </>
  );
}