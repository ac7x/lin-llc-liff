"use client";

import { getAllWorkFlows, WorkFlowEntity } from "@/app/actions/workflow.action";
import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { getAllWorkTasks, WorkTaskEntity } from "@/app/actions/worktask.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import { useEffect, useState } from "react";

export default function WorkTaskPage() {
  const [tasks, setTasks] = useState<WorkTaskEntity[]>([]);
  const [workloads, setWorkloads] = useState<WorkLoadEntity[]>([]);
  const [workFlows, setWorkFlows] = useState<WorkFlowEntity[]>([]);

  useEffect(() => {
    getAllWorkTasks(false).then(data => setTasks(data as WorkTaskEntity[]));
    getAllWorkLoads(false).then(data => setWorkloads(data as WorkLoadEntity[]));
    getAllWorkFlows(true).then(data => setWorkFlows(data as WorkFlowEntity[]));
  }, []);

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">工作任務與工作負載</h1>
        <table className="table-auto w-full border-collapse border border-gray-300 mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">任務名稱</th>
              <th className="border px-2 py-1">流程步驟</th>
              <th className="border px-2 py-1">目標數量</th>
              <th className="border px-2 py-1">單位</th>
              <th className="border px-2 py-1">已完成數量</th>
              <th className="border px-2 py-1">狀態</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const flow = workFlows.find(f => f.flowId === task.flowId);
              const stepName = flow?.steps?.[0]?.stepName || task.flowId;
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