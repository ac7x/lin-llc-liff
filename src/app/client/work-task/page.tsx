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
  const [workloadPage, setWorkloadPage] = useState(1);
  const workloadsPerPage = 10;

  useEffect(() => {
    getAllWorkTasks(false).then(data => setTasks(data as WorkTaskEntity[]));
    getAllWorkLoads(false).then(data => setWorkloads(data as WorkLoadEntity[]));
    getAllWorkFlows(true).then(data => setWorkFlows(data as WorkFlowEntity[]));
  }, []);

  const totalWorkloads = workloads.length;
  const totalPages = Math.ceil(totalWorkloads / workloadsPerPage);
  const pagedWorkloads = workloads.slice(
    (workloadPage - 1) * workloadsPerPage,
    workloadPage * workloadsPerPage
  );

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">工作任務列表</h1>
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
            {tasks.map(task => {
              const flow = workFlows.find(f => f.flowId === task.flowId);
              const stepName = flow?.steps?.[0]?.stepName || task.flowId;
              return (
                <tr key={task.taskId}>
                  <td className="border px-2 py-1">{task.title}</td>
                  <td className="border px-2 py-1">{stepName}</td>
                  <td className="border px-2 py-1">{task.targetQuantity}</td>
                  <td className="border px-2 py-1">{task.unit}</td>
                  <td className="border px-2 py-1">{task.completedQuantity}</td>
                  <td className="border px-2 py-1">{task.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2 className="text-xl font-bold mb-4">任務分割（工作負載）</h2>
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-2 py-1">工作量名稱</th>
              <th className="border px-2 py-1">任務名稱</th>
              <th className="border px-2 py-1">計畫數量</th>
              <th className="border px-2 py-1">單位</th>
              <th className="border px-2 py-1">計畫開始日期</th>
              <th className="border px-2 py-1">計畫結束日期</th>
              <th className="border px-2 py-1">實際完成數量</th>
              <th className="border px-2 py-1">執行者</th>
              <th className="border px-2 py-1">備註</th>
            </tr>
          </thead>
          <tbody>
            {pagedWorkloads.map(load => {
              const task = tasks.find(t => t.taskId === load.taskId);
              return (
                <tr key={load.loadId}>
                  <td className="border px-2 py-1">{load.title || load.loadId}</td>
                  <td className="border px-2 py-1">{task ? task.title : load.taskId}</td>
                  <td className="border px-2 py-1">{load.plannedQuantity}</td>
                  <td className="border px-2 py-1">{load.unit}</td>
                  <td className="border px-2 py-1">{load.plannedStartTime ? load.plannedStartTime.slice(0, 10) : ""}</td>
                  <td className="border px-2 py-1">{load.plannedEndTime ? load.plannedEndTime.slice(0, 10) : ""}</td>
                  <td className="border px-2 py-1">{load.actualQuantity}</td>
                  <td className="border px-2 py-1">{Array.isArray(load.executor) ? load.executor.join("、") : ""}</td>
                  <td className="border px-2 py-1">{load.notes || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-center mt-4 gap-2">
          <button
            disabled={workloadPage === 1}
            className="border rounded px-2 py-1 disabled:opacity-50"
            onClick={() => setWorkloadPage(page => Math.max(1, page - 1))}
          >
            上一頁
          </button>
          <span>第 {workloadPage} / {totalPages} 頁</span>
          <button
            disabled={workloadPage === totalPages || totalPages === 0}
            className="border rounded px-2 py-1 disabled:opacity-50"
            onClick={() => setWorkloadPage(page => Math.min(totalPages, page + 1))}
          >
            下一頁
          </button>
        </div>
      </main>
      <ClientBottomNav />
    </>
  );
}