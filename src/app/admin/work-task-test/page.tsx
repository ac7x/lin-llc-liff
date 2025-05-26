'use client';

import { getAllWorkEpics, updateWorkEpic, WorkEpicEntity, WorkEpicTemplate } from '@/app/actions/workepic.action';
import { WorkLoadEntity } from '@/app/actions/workload.action';
import { WorkTaskEntity } from '@/app/actions/worktask.action';
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

/**
 * 任務成員型別
 */
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

/**
 * 將日期轉換為 ISO 格式
 */
const toISO = (date?: string | null): string => {
  if (!date) return '';
  const d = new Date(date.includes('T') ? date : `${date}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? '' : d.toISOString();
};

export default function WorkTaskPage() {
  const [epics, setEpics] = useState<WorkEpicEntity[]>([]);
  const [members, setMembers] = useState<WorkMember[]>([]);
  const [workloadPage, setWorkloadPage] = useState(1);
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);

  // 拉取 Epic & Member
  useEffect(() => {
    getAllWorkEpics(false).then(data => {
      const epicArr = (data as (WorkEpicEntity | WorkEpicTemplate)[]).filter((e): e is WorkEpicEntity =>
        'owner' in e && 'status' in e && 'priority' in e && 'region' in e && 'address' in e && 'createdAt' in e
      );
      setEpics(epicArr);
    });
    getDocs(collection(firestore, 'workMember')).then(snapshot => {
      setMembers(snapshot.docs.map(doc => doc.data() as WorkMember));
    });
  }, []);

  const allTasks = epics.flatMap(e => e.workTasks ?? []);
  const allWorkloads = epics.flatMap(e => e.workLoads ?? []);

  /**
   * 任務修改
   */
  const handleWorkTaskChange = async (taskId: string, changes: Partial<WorkTaskEntity>) => {
    const epic = epics.find(e => e.workTasks?.some(t => t.taskId === taskId));
    if (!epic) return;
    const updatedTasks = (epic.workTasks ?? []).map(task => task.taskId === taskId ? { ...task, ...changes } : task);
    await updateWorkEpic(epic.epicId, { workTasks: updatedTasks });
    setEpics(prev => prev.map(e => e.epicId === epic.epicId ? { ...e, workTasks: updatedTasks } : e));
  };

  /**
   * 工作量修改
   */
  const handleWorkLoadChange = async (loadId: string, changes: Partial<WorkLoadEntity>) => {
    const epic = epics.find(e => e.workLoads?.some(l => l.loadId === loadId));
    if (!epic) return;
    const updates: Partial<WorkLoadEntity> = {
      ...changes,
      ...(changes.plannedStartTime !== undefined ? { plannedStartTime: toISO(changes.plannedStartTime) } : {}),
      ...(changes.plannedEndTime !== undefined ? { plannedEndTime: toISO(changes.plannedEndTime) } : {}),
    };
    const updatedLoads = (epic.workLoads ?? []).map(load => load.loadId === loadId ? { ...load, ...updates } : load);
    await updateWorkEpic(epic.epicId, { workLoads: updatedLoads });
    setEpics(prev => prev.map(e => e.epicId === epic.epicId ? { ...e, workLoads: updatedLoads } : e));
  };

  /**
   * 實際完成數量同步更新 Task
   */
  const handleActualQuantityChange = async (loadId: string, actualQuantity: number) => {
    const epic = epics.find(e => e.workLoads?.some(l => l.loadId === loadId));
    if (!epic) return;
    await handleWorkLoadChange(loadId, { actualQuantity });
    const updatedLoads = (epic.workLoads ?? []).map(load => load.loadId === loadId ? { ...load, actualQuantity } : load);
    const updatedLoad = updatedLoads.find(load => load.loadId === loadId);
    if (!updatedLoad) return;
    const relatedLoads = updatedLoads.filter(load => load.taskId === updatedLoad.taskId);
    const totalActual = relatedLoads.reduce((sum, load) => sum + (load.actualQuantity || 0), 0);
    await handleWorkTaskChange(updatedLoad.taskId, { completedQuantity: totalActual });
  };

  const getExecutorArray = (executor?: string[] | string) =>
    Array.isArray(executor) ? executor : typeof executor === 'string' && executor ? [executor] : [];

  const pagedTasks = allTasks.slice((workloadPage - 1) * workloadsPerPage, workloadPage * workloadsPerPage);
  const totalPages = Math.ceil(allTasks.length / workloadsPerPage);

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds(ids =>
      ids.includes(taskId) ? ids.filter(id => id !== taskId) : [...ids, taskId]
    );
  };

  return (
    <>
      <main className="p-4 bg-white dark:bg-gray-900 min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-center md:text-left text-gray-900 dark:text-gray-100">
          {"工作任務/工作量合併表"}
        </h1>
        <div className="flex flex-wrap gap-4 justify-center">
          {pagedTasks.map(task => {
            const taskWorkloads = allWorkloads.filter(w => w.taskId === task.taskId);
            const isExpanded = expandedTaskIds.includes(task.taskId);
            const epic = epics.find(e => e.workTasks?.some(t => t.taskId === task.taskId));
            const workZoneStr = epic?.workZones && epic.workZones.length > 0 ? epic.workZones.map(z => z.title).join('、') : '-';
            return (
              <div key={task.taskId} className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 p-4 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base text-gray-900 dark:text-gray-100">{task.title}</span>
                  <button
                    type="button"
                    className={`text-xs underline px-2 py-1 rounded transition-colors ${isExpanded ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
                    style={{ minWidth: 56 }}
                    onClick={() => toggleExpand(task.taskId)}
                  >
                    {isExpanded ? '收合' : '展開'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-900 dark:text-gray-100 mb-2">
                  <span className="text-gray-500 dark:text-gray-400">目標：</span>
                  <span>{task.targetQuantity} {task.unit}</span>
                  <span className="text-gray-500 dark:text-gray-400">已完成：</span>
                  <span>{task.completedQuantity}</span>
                  <span className="text-gray-500 dark:text-gray-400">狀態：</span>
                  <span>{task.status}</span>
                  <span className="text-gray-500 dark:text-gray-400">工作區：</span>
                  <span>{workZoneStr}</span>
                </div>
                {isExpanded && taskWorkloads.length > 0 && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{"工作量"}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border px-2 py-1">名稱</th>
                            <th className="border px-2 py-1">計畫數量</th>
                            <th className="border px-2 py-1">單位</th>
                            <th className="border px-2 py-1">計畫開始</th>
                            <th className="border px-2 py-1">計畫結束</th>
                            <th className="border px-2 py-1">實際完成</th>
                            <th className="border px-2 py-1">執行者</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taskWorkloads.map(load => (
                            <tr key={load.loadId} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                              <td className="border px-2 py-1">{load.title || load.loadId}</td>
                              <td className="border px-2 py-1">
                                <input
                                  type="number"
                                  className="border p-1 w-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  value={load.plannedQuantity}
                                  onChange={e =>
                                    handleWorkLoadChange(load.loadId, { plannedQuantity: Number(e.target.value) })
                                  }
                                  min={0}
                                />
                              </td>
                              <td className="border px-2 py-1">{load.unit}</td>
                              <td className="border px-2 py-1">
                                <input
                                  type="date"
                                  className="border p-1 w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  value={load.plannedStartTime?.slice(0, 10) || ''}
                                  onChange={e =>
                                    handleWorkLoadChange(load.loadId, { plannedStartTime: e.target.value })
                                  }
                                />
                              </td>
                              <td className="border px-2 py-1">
                                <input
                                  type="date"
                                  className="border p-1 w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  value={load.plannedEndTime?.slice(0, 10) || ''}
                                  onChange={e =>
                                    handleWorkLoadChange(load.loadId, { plannedEndTime: e.target.value })
                                  }
                                />
                              </td>
                              <td className="border px-2 py-1">
                                <input
                                  type="number"
                                  className="border p-1 w-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  value={load.actualQuantity}
                                  onChange={e =>
                                    handleActualQuantityChange(load.loadId, Number(e.target.value))
                                  }
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
                                  className="border rounded px-1 py-0.5 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                  {members.map(member => (
                                    <option key={member.memberId} value={member.name}>{member.name}</option>
                                  ))}
                                </select>
                                <div className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                                  {getExecutorArray(load.executor).join('、')}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center mt-4 gap-2">
          <button
            disabled={workloadPage === 1}
            className="border rounded px-2 py-1 disabled:opacity-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            onClick={() => setWorkloadPage(page => Math.max(1, page - 1))}
          >上一頁</button>
          <span>第 {workloadPage} / {totalPages} 頁</span>
          <button
            disabled={workloadPage === totalPages || totalPages === 0}
            className="border rounded px-2 py-1 disabled:opacity-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            onClick={() => setWorkloadPage(page => Math.min(totalPages, page + 1))}
          >下一頁</button>
        </div>
      </main>
      <AdminBottomNav />
    </>
  );
}