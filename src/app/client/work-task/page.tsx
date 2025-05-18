"use client";

import { getAllWorkTasks, WorkTaskEntity } from "@/app/actions/worktask.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { useEffect, useState } from "react";

export default function WorkTaskPage() {
  const [tasks, setTasks] = useState<WorkTaskEntity[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const data = await getAllWorkTasks(false);
      setTasks(data as WorkTaskEntity[]);
    };
    fetchTasks();
  }, []);

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">工作任務列表</h1>
        <table className="table-auto w-full border-collapse border border-gray-300">
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
      </main>
      <GlobalBottomNav />
    </>
  );
}