"use client";

import type { WorkFlowEntity } from "@/app/actions/workflow.action";
import { getAllWorkFlows } from "@/app/actions/workflow.action";
import { getAllWorkLoads, updateWorkLoad, WorkLoadEntity } from "@/app/actions/workload.action";
import { getAllWorkTasks, updateWorkTask, WorkTaskEntity } from "@/app/actions/worktask.action";
import { firestore } from "@/modules/shared/infrastructure/persistence/firebase/client";
import { ClientBottomNav } from "@/modules/shared/interfaces/navigation/ClientBottomNav";
import { collection, getDocs } from "firebase/firestore";
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
  const [members, setMembers] = useState<WorkMember[]>([]);
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

  useEffect(() => {
    const fetchMembers = async () => {
      const membersCollection = collection(firestore, "workMember");
      const snapshot = await getDocs(membersCollection);
      const data: WorkMember[] = snapshot.docs.map(doc => doc.data() as WorkMember);
      setMembers(data);
    };
    fetchMembers();
  }, []);

  // 新增：取得所有流程
  useEffect(() => {
    const fetchWorkFlows = async () => {
      const flows = await getAllWorkFlows(true);
      setWorkFlows(flows as WorkFlowEntity[]);
    };
    fetchWorkFlows();
  }, []);

  // 新增：處理實際完成數量變更
  const handleActualQuantityChange = async (loadId: string, actualQuantity: number) => {
    await updateWorkLoad(loadId, { actualQuantity });
    // 先更新 workloads 狀態
    setWorkloads(prev =>
      prev.map(load =>
        load.loadId === loadId ? { ...load, actualQuantity } : load
      )
    );

    // 取得該 load 對應的 taskId
    // 注意：此時 workloads 尚未 set 完成，需用 prev 狀態計算
    const updatedLoad = workloads.find(load => load.loadId === loadId);
    if (!updatedLoad) return;
    const taskId = updatedLoad.taskId;

    // 取得所有屬於該 taskId 的 workloads，並將本次變更的 actualQuantity 帶入
    const relatedLoads = workloads
      .map(load => load.loadId === loadId ? { ...load, actualQuantity } : load)
      .filter(load => load.taskId === taskId);

    // 加總 actualQuantity
    const totalActual = relatedLoads.reduce((sum, load) => sum + (load.actualQuantity || 0), 0);

    // 更新對應的 workTask.completedQuantity
    await updateWorkTask(taskId, { completedQuantity: totalActual });
    setTasks(prev =>
      prev.map(task =>
        task.taskId === taskId ? { ...task, completedQuantity: totalActual } : task
      )
    );
  };

  // 新增：處理計劃數量變更
  const handlePlannedQuantityChange = async (loadId: string, plannedQuantity: number) => {
    await updateWorkLoad(loadId, { plannedQuantity });
    setWorkloads(prev =>
      prev.map(load =>
        load.loadId === loadId ? { ...load, plannedQuantity } : load
      )
    );
  };

  // 新增：處理計劃開始時間變更
  const handlePlannedStartTimeChange = async (loadId: string, plannedStartTime: string) => {
    await updateWorkLoad(loadId, { plannedStartTime });
    setWorkloads(prev =>
      prev.map(load =>
        load.loadId === loadId ? { ...load, plannedStartTime } : load
      )
    );
  };

  // 新增：處理計劃結束時間變更
  const handlePlannedEndTimeChange = async (loadId: string, plannedEndTime: string) => {
    await updateWorkLoad(loadId, { plannedEndTime });
    setWorkloads(prev =>
      prev.map(load =>
        load.loadId === loadId ? { ...load, plannedEndTime } : load
      )
    );
  };

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
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="border p-1 w-20"
                      value={load.plannedQuantity}
                      onChange={e => handlePlannedQuantityChange(load.loadId, Number(e.target.value))}
                      min={0}
                    />
                  </td>
                  <td className="border px-2 py-1">{load.unit}</td>
                  <td className="border px-2 py-1">
                    <input
                      type="date"
                      className="border p-1 w-44"
                      value={load.plannedStartTime ? load.plannedStartTime.slice(0, 10) : ''}
                      onChange={e => handlePlannedStartTimeChange(load.loadId, e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="date"
                      className="border p-1 w-44"
                      value={load.plannedEndTime ? load.plannedEndTime.slice(0, 10) : ''}
                      onChange={e => handlePlannedEndTimeChange(load.loadId, e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="border p-1 w-20"
                      value={load.actualQuantity}
                      onChange={e => handleActualQuantityChange(load.loadId, Number(e.target.value))}
                      min={0}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <select
                      multiple
                      value={load.executor ? load.executor.split(',') : []}
                      onChange={async e => {
                        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        await updateWorkLoad(load.loadId, { executor: selected.join(',') });
                        setWorkloads(prev =>
                          prev.map(l =>
                            l.loadId === load.loadId ? { ...l, executor: selected.join(',') } : l
                          )
                        );
                      }}
                      className="border rounded px-1 py-0.5 w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    >
                      {members.map(member => (
                        <option key={member.memberId} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                    <div className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                      {(load.executor || '').split(',').filter(Boolean).join('、')}
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