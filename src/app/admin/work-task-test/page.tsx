'use client'

import { useEffect, useState } from 'react'

/**
 * 任務型別
 */
interface WorkTask {
  taskId: string
  title: string
  targetQuantity: number
  unit: string
  completedQuantity: number
  status: string
}

/**
 * 工作量型別
 */
interface WorkLoad {
  loadId: string
  taskId: string
  title: string
  plannedQuantity: number
  unit: string
  plannedStartTime: string
  plannedEndTime: string
  actualQuantity: number
  executor: string[]
}

const workloadsPerPage = 10

const mockTasks: WorkTask[] = [
  {
    taskId: '1',
    title: '任務A',
    targetQuantity: 100,
    unit: '件',
    completedQuantity: 20,
    status: '進行中'
  },
  {
    taskId: '2',
    title: '任務B',
    targetQuantity: 50,
    unit: '次',
    completedQuantity: 50,
    status: '已完成'
  }
]

const mockWorkloads: WorkLoad[] = [
  {
    loadId: 'l1',
    taskId: '1',
    title: '子工作1',
    plannedQuantity: 50,
    unit: '件',
    plannedStartTime: '2024-05-01',
    plannedEndTime: '2024-05-10',
    actualQuantity: 10,
    executor: ['王小明', '李小美']
  },
  {
    loadId: 'l2',
    taskId: '1',
    title: '子工作2',
    plannedQuantity: 50,
    unit: '件',
    plannedStartTime: '2024-05-11',
    plannedEndTime: '2024-05-20',
    actualQuantity: 10,
    executor: ['王小明']
  },
  {
    loadId: 'l3',
    taskId: '2',
    title: '子工作3',
    plannedQuantity: 50,
    unit: '次',
    plannedStartTime: '2024-05-05',
    plannedEndTime: '2024-05-15',
    actualQuantity: 50,
    executor: ['林大華']
  }
]

const getExecutorArray = (executor: string[] | string | undefined): string[] =>
  Array.isArray(executor) ? executor : (typeof executor === 'string' && executor ? [executor] : [])

export default function WorkTaskPage() {
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [workloads, setWorkloads] = useState<WorkLoad[]>([])
  const [workloadPage, setWorkloadPage] = useState(1)
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([])

  useEffect(() => {
    // 實際應用請換成 API 載入
    setTasks(mockTasks)
    setWorkloads(mockWorkloads)
  }, [])

  const pagedTasks = tasks.slice((workloadPage - 1) * workloadsPerPage, workloadPage * workloadsPerPage)
  const totalPages = Math.ceil(tasks.length / workloadsPerPage)

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds(ids =>
      ids.includes(taskId) ? ids.filter(id => id !== taskId) : [...ids, taskId]
    )
  }

  return (
    <main className="p-4 bg-white dark:bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left text-gray-900 dark:text-gray-100">
        {"工作任務/工作量合併表"}
      </h1>
      <div className="flex flex-wrap gap-4 justify-center">
        {pagedTasks.map(task => {
          const taskWorkloads = workloads.filter(w => w.taskId === task.taskId)
          const isExpanded = expandedTaskIds.includes(task.taskId)
          return (
            <div key={task.taskId} className="w-full max-w-xl bg-white dark:bg-gray-950 rounded-lg border border-gray-300 dark:border-gray-700 p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-gray-900 dark:text-gray-100">{task.title}</span>
                <button
                  type="button"
                  className={`text-xs underline px-2 py-1 rounded transition-colors ${isExpanded ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
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
              </div>
              {isExpanded && taskWorkloads.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold mb-1 text-gray-900 dark:text-gray-100">工作量</div>
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
                          <tr key={load.loadId} className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                            <td className="border px-2 py-1">{load.title}</td>
                            <td className="border px-2 py-1">{load.plannedQuantity}</td>
                            <td className="border px-2 py-1">{load.unit}</td>
                            <td className="border px-2 py-1">{load.plannedStartTime}</td>
                            <td className="border px-2 py-1">{load.plannedEndTime}</td>
                            <td className="border px-2 py-1">{load.actualQuantity}</td>
                            <td className="border px-2 py-1">{getExecutorArray(load.executor).join('、')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-center mt-4 gap-2">
        <button
          disabled={workloadPage === 1}
          className="border rounded px-2 py-1 disabled:opacity-50 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          onClick={() => setWorkloadPage(page => Math.max(1, page - 1))}
        >上一頁</button>
        <span>第 {workloadPage} / {totalPages} 頁</span>
        <button
          disabled={workloadPage === totalPages || totalPages === 0}
          className="border rounded px-2 py-1 disabled:opacity-50 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          onClick={() => setWorkloadPage(page => Math.min(totalPages, page + 1))}
        >下一頁</button>
      </div>
    </main>
  )
}