"use client";

import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { getAllWorkTasks, WorkTaskEntity } from "@/app/actions/worktask.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { useEffect, useState } from "react";

export default function WorkTaskPage() {
  const [tasks, setTasks] = useState<WorkTaskEntity[]>([]);
  const [workloads, setWorkloads] = useState<WorkLoadEntity[]>([]);

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

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">工作任務列表</h1>
        <table className="table-auto w-full border-collapse border border-gray-300 mb-8">
          <thead>
            <tr>
              <th className="border px-2 py-1">任務ID</th>
              <th className="border px-2 py-1">項目ID</th>
              <th className="border px-2 py-1">目標數量</th>
              <th className="border px-2 py-1">單位</th>
              <th className="border px-2 py-1">已完成數量</th>
              <th className="border px-2 py-1">狀態</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.taskId}>
                <td className="border px-2 py-1">{task.taskId}</td>
                <td className="border px-2 py-1">{task.itemId}</td>
                <td className="border px-2 py-1">{task.targetQuantity}</td>
                <td className="border px-2 py-1">{task.unit}</td>
                <td className="border px-2 py-1">{task.completedQuantity}</td>
                <td className="border px-2 py-1">{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-xl font-bold mb-4">任務分割（工作負載）</h2>
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-2 py-1">負載ID</th>
              <th className="border px-2 py-1">任務ID</th>
              <th className="border px-2 py-1">計劃數量</th>
              <th className="border px-2 py-1">單位</th>
              <th className="border px-2 py-1">計劃開始</th>
              <th className="border px-2 py-1">計劃結束</th>
              <th className="border px-2 py-1">實際完成</th>
              <th className="border px-2 py-1">執行者</th>
              <th className="border px-2 py-1">備註</th>
            </tr>
          </thead>
          <tbody>
            {workloads.map(load => (
              <tr key={load.loadId}>
                <td className="border px-2 py-1">{load.loadId}</td>
                <td className="border px-2 py-1">{load.taskId}</td>
                <td className="border px-2 py-1">{load.plannedQuantity}</td>
                <td className="border px-2 py-1">{load.unit}</td>
                <td className="border px-2 py-1">{load.plannedStartTime}</td>
                <td className="border px-2 py-1">{load.plannedEndTime}</td>
                <td className="border px-2 py-1">{load.actualQuantity}</td>
                <td className="border px-2 py-1">{load.executor}</td>
                <td className="border px-2 py-1">{load.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      <GlobalBottomNav />
    </>
  );
}