"use client";

import type { WorkFlowEntity } from "@/app/actions/workflow.action";
import { WorkLoadEntity } from "@/app/actions/workload.action";
import { WorkTaskEntity } from "@/app/actions/worktask.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";

export default function WorkTaskPage() {
  // 僅顯示 props 或 state 內容，不包含任何資料取得、更新、互動邏輯
  // 假設 tasks、workloads、workFlows 由父層傳入或外部取得，這裡僅負責渲染
  // 這裡用假資料作為展示
  const tasks: WorkTaskEntity[] = [];
  const workloads: WorkLoadEntity[] = [];
  const workFlows: WorkFlowEntity[] = [];
  const workloadPage = 1;
  const workloadsPerPage = 10;
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
          <tbody>
            {pagedWorkloads.map(load => {
              const task = tasks.find(t => t.taskId === load.taskId);
              return (
                <tr key={load.loadId}>
                  <td className="border px-2 py-1">{task?.title || ""}</td>
                  <td className="border px-2 py-1">{load.plannedQuantity}</td>
                  <td className="border px-2 py-1">{load.actualQuantity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-center mt-4 gap-2">
          <button
            disabled={workloadPage === 1}
            className="border rounded px-2 py-1 disabled:opacity-50"
          >
            上一頁
          </button>
          <span>第 {workloadPage} / {totalPages} 頁</span>
          <button
            disabled={workloadPage === totalPages || totalPages === 0}
            className="border rounded px-2 py-1 disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      </main>
      <ClientBottomNav />
    </>
  );
}