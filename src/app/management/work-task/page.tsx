'use client';

import { getAllWorkEpics, updateWorkEpic, WorkEpicEntity, WorkEpicTemplate } from '@/app/actions/workepic.action';
import { WorkLoadEntity } from '@/app/actions/workload.action';
import { WorkTaskEntity } from '@/app/actions/worktask.action';
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp';
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
  const [epics, setEpics] = useState<WorkEpicEntity[]>([]);
  const [workloadPage, setWorkloadPage] = useState(1);
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    getAllWorkEpics(false).then(data => {
      const epicArr = (data as (WorkEpicEntity | WorkEpicTemplate)[]).filter((e): e is WorkEpicEntity =>
        'owner' in e && 'status' in e && 'priority' in e && 'region' in e && 'address' in e && 'createdAt' in e
      );
      setEpics(epicArr);
      const allTasks = epicArr.flatMap(e => Array.isArray(e.workTasks) ? e.workTasks : []);
      const allLoads = epicArr.flatMap(e => Array.isArray(e.workLoads) ? e.workLoads : []);
      setTasks(allTasks);
      setWorkloads(allLoads);
    });
    getDocs(collection(firestore, 'workMember')).then(snapshot => {
      setMembers(snapshot.docs.map(doc => doc.data() as WorkMember));
    });
  }, []);

  const handleWorkTaskChange = async (taskId: string, changes: Partial<WorkTaskEntity>) => {
    const epic = epics.find(e => Array.isArray(e.workTasks) && e.workTasks.some(t => t.taskId === taskId));
    if (!epic) return;
    const updatedTasks = (epic.workTasks || []).map(task => task.taskId === taskId ? { ...task, ...changes } : task);
    await updateWorkEpic(epic.epicId, { workTasks: updatedTasks });
    setEpics(prev => prev.map(e => e.epicId === epic.epicId ? { ...e, workTasks: updatedTasks } : e));
    setTasks(prev => prev.map(task => task.taskId === taskId ? { ...task, ...changes } : task));
  };

  const handleWorkLoadChange = async (loadId: string, changes: Partial<WorkLoadEntity>) => {
    const epic = epics.find(e => Array.isArray(e.workLoads) && e.workLoads.some(l => l.loadId === loadId));
    if (!epic) return;
    const updatedLoads = (epic.workLoads || []).map(load => load.loadId === loadId ? { ...load, ...changes } : load);
    await updateWorkEpic(epic.epicId, { workLoads: updatedLoads });
    setEpics(prev => prev.map(e => e.epicId === epic.epicId ? { ...e, workLoads: updatedLoads } : e));
    setWorkloads(prev => prev.map(load => load.loadId === loadId ? { ...load, ...changes } : load));
  };

  const handleActualQuantityChange = async (loadId: string, actualQuantity: number) => {
    await handleWorkLoadChange(loadId, { actualQuantity });
    setWorkloads(prev => {
      const updated = prev.map(load => load.loadId === loadId ? { ...load, actualQuantity } : load);
      const updatedLoad = updated.find(load => load.loadId === loadId);
      if (!updatedLoad) return prev;
      const relatedLoads = updated.filter(load => load.taskId === updatedLoad.taskId);
      const totalActual = relatedLoads.reduce((sum, load) => sum + (load.actualQuantity || 0), 0);
      handleWorkTaskChange(updatedLoad.taskId, { completedQuantity: totalActual });
      setTasks(prevTask =>
        prevTask.map(task =>
          task.taskId === updatedLoad.taskId ? { ...task, completedQuantity: totalActual } : task
        )
      );
      return updated;
    });
  };

  const getExecutorArray = (executor: string[] | string | undefined) =>
    Array.isArray(executor) ? executor : (typeof executor === 'string' && executor ? [executor] : []);

  const pagedTasks = tasks.slice((workloadPage - 1) * workloadsPerPage, workloadPage * workloadsPerPage);
  const totalPages = Math.ceil(tasks.length / workloadsPerPage);

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds(ids =>
      ids.includes(taskId) ? ids.filter(id => id !== taskId) : [...ids, taskId]
    );
  };

  return (
    <>
      <main className="p-4 bg-background text-foreground min-h-screen">
        <h1 className="text-2xl font-bold mb-4">工作任務/工作量合併表</h1>
        <table className="table-auto w-full border-collapse border border-border mb-8">
          <thead>
            <tr>
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">任務名稱</th>
              <th className="border px-2 py-1">目標數量</th>
              <th className="border px-2 py-1">單位</th>
              <th className="border px-2 py-1">已完成</th>
              <th className="border px-2 py-1">狀態</th>
              <th className="border px-2 py-1">工作區</th>
              <th className="border px-2 py-1">展開</th>
            </tr>
          </thead>
          <tbody>
            {pagedTasks.map((task, idx) => {
              const taskWorkloads = workloads.filter(w => w.taskId === task.taskId);
              const isExpanded = expandedTaskIds.includes(task.taskId);
              const epic = epics.find(e => Array.isArray(e.workTasks) && e.workTasks.some(t => t.taskId === task.taskId));
              const workZoneStr = epic && Array.isArray(epic.workZones) && epic.workZones.length > 0 ? epic.workZones.map(z => z.title).join('、') : '-';
              return (
                <>
                  <tr className="bg-card hover:bg-muted transition-colors" key={task.taskId}>
                    <td className="border px-2 py-1">{(workloadPage - 1) * workloadsPerPage + idx + 1}</td>
                    <td className="border px-2 py-1">{task.title}</td>
                    <td className="border px-2 py-1">{task.targetQuantity}</td>
                    <td className="border px-2 py-1">{task.unit}</td>
                    <td className="border px-2 py-1">{task.completedQuantity}</td>
                    <td className="border px-2 py-1">{task.status}</td>
                    <td className="border px-2 py-1">{workZoneStr}</td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        type="button"
                        className={`underline px-2 py-1 rounded transition-colors ${isExpanded ? 'bg-muted text-muted-foreground' : 'bg-background text-foreground'}`}
                        style={{ minWidth: 56 }}
                        onClick={() => toggleExpand(task.taskId)}
                      >
                        {isExpanded ? '收合' : '展開'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && taskWorkloads.length > 0 && (
                    <tr key={task.taskId + '_workloads'} className="bg-muted text-muted-foreground">
                      <td colSpan={7} className="p-0">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border px-2 py-1">工作量名稱</th>
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
                              <tr key={load.loadId} className="bg-background text-foreground">
                                <td className="border px-2 py-1">{load.title || load.loadId}</td>
                                <td className="border px-2 py-1">
                                  <input
                                    type="number"
                                    className="border p-1 w-20"
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
                                    className="border p-1 w-32"
                                    value={load.plannedStartTime?.slice(0, 10) || ''}
                                    onChange={e =>
                                      handleWorkLoadChange(load.loadId, { plannedStartTime: e.target.value })
                                    }
                                  />
                                </td>
                                <td className="border px-2 py-1">
                                  <input
                                    type="date"
                                    className="border p-1 w-32"
                                    value={load.plannedEndTime?.slice(0, 10) || ''}
                                    onChange={e =>
                                      handleWorkLoadChange(load.loadId, { plannedEndTime: e.target.value })
                                    }
                                  />
                                </td>
                                <td className="border px-2 py-1">
                                  <input
                                    type="number"
                                    className="border p-1 w-20"
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
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