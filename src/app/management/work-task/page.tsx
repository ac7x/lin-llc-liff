"use client";

import { getAllWorkFlows, WorkFlowEntity } from '@/app/actions/workflow.action';
import { getAllWorkLoads, updateWorkLoad, WorkLoadEntity } from '@/app/actions/workload.action';
import { getAllWorkTasks, updateWorkTask, WorkTaskEntity } from '@/app/actions/worktask.action';
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/client';
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface WorkMember {
  taskId?: string;
  memberId: string;
  name: string;
  role: string;
  skills: string[];
  availability: string;
  contactInfo?: { phone?: string; email?: string };
  status: string;
  lastActiveTime?: string;
}

const workloadsPerPage = 10;

export default function WorkTaskPage() {
  const [tasks, setTasks] = useState<WorkTaskEntity[]>([]);
  const [workloads, setWorkloads] = useState<WorkLoadEntity[]>([]);
  const [members, setMembers] = useState<WorkMember[]>([]);
  const [workFlows, setWorkFlows] = useState<WorkFlowEntity[]>([]);
  const [workloadPage, setWorkloadPage] = useState(1);

  useEffect(() => {
    getAllWorkTasks(false).then((data) => setTasks(data as WorkTaskEntity[]));
    getAllWorkLoads(false).then((data) => setWorkloads(data as WorkLoadEntity[]));
    getAllWorkFlows(true).then((flows) => setWorkFlows(flows as WorkFlowEntity[]));
    getDocs(collection(firestore, 'workMember')).then(snapshot => {
      setMembers(snapshot.docs.map(doc => doc.data() as WorkMember));
    });
  }, []);

  const handleWorkLoadChange = async (loadId: string, changes: Partial<WorkLoadEntity>) => {
    await updateWorkLoad(loadId, changes);
    setWorkloads(prev => prev.map(load => load.loadId === loadId ? { ...load, ...changes } : load));
  };

  const handleActualQuantityChange = async (loadId: string, actualQuantity: number) => {
    await handleWorkLoadChange(loadId, { actualQuantity });
    // 用 prev 狀態計算，不要用 workloads，避免異步問題
    setWorkloads(prev => {
      const updated = prev.map(load => load.loadId === loadId ? { ...load, actualQuantity } : load);
      const updatedLoad = updated.find(load => load.loadId === loadId);
      if (!updatedLoad) return prev;
      const relatedLoads = updated.filter(load => load.taskId === updatedLoad.taskId);
      const totalActual = relatedLoads.reduce((sum, load) => sum + (load.actualQuantity || 0), 0);
      updateWorkTask(updatedLoad.taskId, { completedQuantity: totalActual });
      setTasks(prevTask =>
        prevTask.map(task =>
          task.taskId === updatedLoad.taskId ? { ...task, completedQuantity: totalActual } : task
        )
      );
      return updated;
    });
  };

  const pagedWorkloads = workloads.slice((workloadPage - 1) * workloadsPerPage, workloadPage * workloadsPerPage);
  const totalPages = Math.ceil(workloads.length / workloadsPerPage);

  const getExecutorArray = (executor: string[] | string | undefined) =>
    Array.isArray(executor) ? executor : (typeof executor === 'string' && executor ? [executor] : []);

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
            {[...tasks]
              .sort((a, b) => {
                const orderA = workFlows.find(f => f.flowId === a.flowId)?.steps?.[0]?.order ?? 0;
                const orderB = workFlows.find(f => f.flowId === b.flowId)?.steps?.[0]?.order ?? 0;
                return orderA - orderB;
              })
              .map(task => {
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
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="border p-1 w-20"
                      value={load.plannedQuantity}
                      onChange={e => handleWorkLoadChange(load.loadId, { plannedQuantity: Number(e.target.value) })}
                      min={0}
                    />
                  </td>
                  <td className="border px-2 py-1">{load.unit}</td>
                  <td className="border px-2 py-1">
                    <input
                      type="date"
                      className="border p-1 w-44"
                      value={load.plannedStartTime?.slice(0, 10) || ''}
                      onChange={e => handleWorkLoadChange(load.loadId, { plannedStartTime: e.target.value })}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="date"
                      className="border p-1 w-44"
                      value={load.plannedEndTime?.slice(0, 10) || ''}
                      onChange={e => handleWorkLoadChange(load.loadId, { plannedEndTime: e.target.value })}
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
                      value={getExecutorArray(load.executor)}
                      onChange={async e => {
                        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        await handleWorkLoadChange(load.loadId, { executor: selected });
                      }}
                      className="border rounded px-1 py-0.5 w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    >
                      {members.map(member => (
                        <option key={member.memberId} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                    <div className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                      {getExecutorArray(load.executor).join('、')}
                    </div>
                  </td>
                  <td className="border px-2 py-1">{load.notes || ''}</td>
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
          >上一頁</button>
          <span>第 {workloadPage} / {totalPages} 頁</span>
          <button
            disabled={workloadPage === totalPages || totalPages === 0}
            className="border rounded px-2 py-1 disabled:opacity-50"
            onClick={() => setWorkloadPage(page => Math.min(totalPages, page + 1))}
          >下一頁</button>
        </div>
      </main>
      <ManagementBottomNav />
    </>
  );
}