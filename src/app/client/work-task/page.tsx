"use client";

import type { WorkFlowEntity } from "@/app/actions/workflow.action";
import { getAllWorkFlows } from "@/app/actions/workflow.action";
import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { getAllWorkTasks, WorkTaskEntity } from "@/app/actions/worktask.action";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import { useEffect, useState } from "react";

interface WorkMember {
  taskId?: string;
  memberId: string;
  name: string;
  role: string;
  skills: string[];
  availability: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  status: string;
  lastActiveTime?: string;
}

export default function WorkTaskPage() {
  const [tasks, setTasks] = useState<WorkTaskEntity[]>([]);
  const [workloads, setWorkloads] = useState<WorkLoadEntity[]>([]);
  // 移除未使用的 members 狀態與 useEffect
  const [workFlows, setWorkFlows] = useState<WorkFlowEntity[]>([]); // 新增：儲存所有流程

  // 分頁狀態
  const [workloadPage, setWorkloadPage] = useState(1);
  const workloadsPerPage = 10; // 每頁顯示 10 筆

  // 計算分頁後的 workloads
  const totalWorkloads = workloads.length;
  const totalPages = Math.ceil(totalWorkloads / workloadsPerPage);
  const pagedWorkloads = workloads.slice(
    (workloadPage - 1) * workloadsPerPage,
    workloadPage * workloadsPerPage
  );

  useEffect(() => {
    const fetchTasks = async () => {
      const data = await getAllWorkTasks(false);
      setTasks(data as WorkTaskEntity[]);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchWorkloads = async () => {
      const data = await getAllWorkLoads(false);
      setWorkloads(data as WorkLoadEntity[]);
    };
    fetchWorkloads();
  }, []);

  // useEffect(() => {
  //   const fetchMembers = async () => {
  //     const membersCollection = collection(firestore, "workMember");
  //     const snapshot = await getDocs(membersCollection);
  //     const data: WorkMember[] = snapshot.docs.map(doc => doc.data() as WorkMember);
  //     setMembers(data);
  //   };
  //   fetchMembers();
  // }, []);

  // 新增：取得所有流程
  useEffect(() => {
    const fetchWorkFlows = async () => {
      const flows = await getAllWorkFlows(true);
      setWorkFlows(flows as WorkFlowEntity[]);
    };
    fetchWorkFlows();
  }, []);

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
              // 取得對應流程
              const flow = workFlows.find(f => f.flowId === task.flowId);
              // 取得第一個步驟名稱
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
                  <td className="border px-2 py-1">{load.title || load.loadId}</td>
                  <td className="border px-2 py-1">{task ? task.title : load.taskId}</td>
                  <td className="border px-2 py-1">{load.plannedQuantity}</td>
                  <td className="border px-2 py-1">{load.unit}</td>
                  <td className="border px-2 py-1">{load.plannedStartTime ? load.plannedStartTime.slice(0, 10) : ''}</td>
                  <td className="border px-2 py-1">{load.plannedEndTime ? load.plannedEndTime.slice(0, 10) : ''}</td>
                  <td className="border px-2 py-1">{load.actualQuantity}</td>
                  <td className="border px-2 py-1">
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      {Array.isArray(load.executor) ? load.executor.join('、') : ''}
                    </div>
                  </td>
                  <td className="border px-2 py-1">{load.notes || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* 分頁控制元件 */}
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