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
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">工作任務與工作負載</h1>
        <div className="mb-4">
          <select className="border p-2" value={selectedEpicId} onChange={e => setSelectedEpicId(e.target.value)}>
            <option value="">全部標的</option>
            {epics.map(epic => (
              <option key={epic.epicId} value={epic.epicId}>{epic.title}</option>
            ))}
          </select>
        </div>
        <table className="table-auto w-full border-collapse border border-gray-300 mb-8">
          <thead>
            <tr>
              <th className="border px-2 py-1">任務名稱</th>
              <th className="border px-2 py-1">流程步驟</th>
              <th className="border px-2 py-1">目標數量</th>
              <th className="border px-2 py-1">單位</th>
              <th className="border px-2 py-1">已完成數量</th>
              <th className="border px-2 py-1">狀態</th>
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
                const orderedSteps = flow?.steps?.slice().sort((a: any, b: any) => a.order - b.order) || [];
                const stepName = orderedSteps[0]?.stepName || task.flowId;
                const relatedLoads = workloads.filter(load => load.taskId === task.taskId);

                return (
                  <tr key={task.taskId}>
                    <td className="border px-2 py-1 align-top">
                      <div className="font-semibold">{task.title}</div>
                      {relatedLoads.length > 0 && (
                        <table className="mt-2 table-auto w-full border-collapse border border-gray-200 text-sm">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1">工作量名稱</th>
                              <th className="border px-2 py-1">計畫數量</th>
                              <th className="border px-2 py-1">單位</th>
                              <th className="border px-2 py-1">計畫開始</th>
                              <th className="border px-2 py-1">計畫結束</th>
                              <th className="border px-2 py-1">完成數量</th>
                              <th className="border px-2 py-1">執行者</th>
                              <th className="border px-2 py-1">備註</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatedLoads.map(load => (
                              <tr key={load.loadId}>
                                <td className="border px-2 py-1">{load.title || load.loadId}</td>
                                <td className="border px-2 py-1">{load.plannedQuantity}</td>
                                <td className="border px-2 py-1">{load.unit}</td>
                                <td className="border px-2 py-1">{load.plannedStartTime?.slice(0, 10) || ""}</td>
                                <td className="border px-2 py-1">{load.plannedEndTime?.slice(0, 10) || ""}</td>
                                <td className="border px-2 py-1">{load.actualQuantity}</td>
                                <td className="border px-2 py-1">{Array.isArray(load.executor) ? load.executor.join("、") : ""}</td>
                                <td className="border px-2 py-1">{load.notes || ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                    <td className="border px-2 py-1 align-top">{stepName}</td>
                    <td className="border px-2 py-1 align-top">{task.targetQuantity}</td>
                    <td className="border px-2 py-1 align-top">{task.unit}</td>
                    <td className="border px-2 py-1 align-top">{task.completedQuantity}</td>
                    <td className="border px-2 py-1 align-top">{task.status}</td>
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