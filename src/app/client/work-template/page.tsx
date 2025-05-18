"use client";

import { addWorkFlow, getAllWorkFlows, WorkFlow } from "@/app/actions/workflow.action";
import { getAllWorkItems, WorkItemTemplate } from "@/app/actions/workitem.action";
import { WorkLoad } from "@/app/actions/workload.action";
import { WorkTask } from "@/app/actions/worktask.action";
import { addWorkType, getAllWorkTypes, WorkType } from "@/app/actions/worktype.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import React, { useEffect, useState } from "react";

const WorkTemplatePage: React.FC = () => {
    const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
    const [newWorkTypeTitle, setNewWorkTypeTitle] = useState("");
    const [workFlows, setWorkFlows] = useState<WorkFlow[]>([]);
    const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string | null>(null);
    const [newStepName, setNewStepName] = useState("");
    const [newStepOrder, setNewStepOrder] = useState<number>(1);
    const [newStepSkills, setNewStepSkills] = useState<string>("");
    const [workItems, setWorkItems] = useState<WorkItemTemplate[]>([]);
    const [workTasks, setWorkTasks] = useState<WorkTask[]>([]);
    const [workLoads, setWorkLoads] = useState<WorkLoad[]>([]);

    useEffect(() => {
        const fetchWorkTypes = async () => {
            try {
                const types = await getAllWorkTypes();
                setWorkTypes(types);
            } catch (error) {
                console.error("無法載入工作種類資料:", error);
            }
        };
        fetchWorkTypes();
    }, []);

    useEffect(() => {
        const fetchWorkFlows = async () => {
            try {
                const flows = await getAllWorkFlows();
                setWorkFlows(flows);
            } catch (error) {
                console.error("無法載入工作流程資料:", error);
            }
        };
        fetchWorkFlows();
    }, []);

    useEffect(() => {
        const fetchWorkItems = async () => {
            try {
                const items = await getAllWorkItems(true); // 傳入 true 表示模板階段
                setWorkItems(items as WorkItemTemplate[]);
            } catch (error) {
                console.error("無法載入工作項目資料:", error);
            }
        };
        fetchWorkItems();
    }, []);

    const handleAddWorkType = async () => {
        if (!newWorkTypeTitle.trim()) {
            alert("請輸入工作種類標題！");
            return;
        }

        const newWorkType = {
            typeId: `type-${Date.now()}`,
            title: newWorkTypeTitle,
            requiredSkills: []
        };

        await addWorkType(newWorkType);
        setWorkTypes(prev => [...prev, newWorkType]);
        setNewWorkTypeTitle("");
    };

    const handleAddStep = async () => {
        if (!selectedWorkTypeId || !newStepName.trim()) {
            alert("請選擇工作種類並填寫步驟名稱！");
            return;
        }

        // 確保順序不重複且有效
        const usedOrders = new Set(
            workFlows
                .filter(flow => flow.workTypeId === selectedWorkTypeId)
                .flatMap(flow => flow.steps.map(step => step.order))
        );

        const availableOrders = Array.from({ length: 10 }, (_, i) => i + 1).filter(order => !usedOrders.has(order));

        if (!availableOrders.includes(newStepOrder)) {
            alert("該順序無效或已存在，請選擇其他順序！");
            return;
        }

        const newFlow: WorkFlow = {
            flowId: `flow-${Date.now()}`,
            workTypeId: selectedWorkTypeId,
            steps: [
                {
                    stepName: newStepName,
                    order: newStepOrder,
                    requiredSkills: newStepSkills.split(",").map(skill => skill.trim())
                }
            ]
        };

        await addWorkFlow(newFlow);
        setWorkFlows(prev => [...prev, newFlow]);
        setNewStepName("");
        setNewStepOrder(1);
        setNewStepSkills("");
    };

    const handleAddWorkItem = () => {
        const newItem: WorkItemTemplate = {
            itemId: `item-${Date.now()}`,
            epicId: "epic-1", // 假設關聯的 EpicID
            flowId: selectedWorkTypeId || "", // 假設關聯的 FlowID
            currentStep: "步驟1", // 假設當前步驟
        };
        setWorkItems(prev => [...prev, newItem]);
    };

    const handleAddWorkTask = () => {
        const newTask: WorkTask = {
            taskId: `task-${Date.now()}`,
            itemId: "item-1", // 假設關聯的 ItemID
            targetQuantity: 100,
            completedQuantity: 0,
            unit: "件",
            status: "待分配"
        };
        setWorkTasks(prev => [...prev, newTask]);
    };

    const handleAddWorkLoad = () => {
        const newLoad: WorkLoad = {
            loadId: `load-${Date.now()}`,
            taskId: "task-1", // 假設關聯的 TaskID
            executor: "member-1", // 假設執行人
            plannedQuantity: 50,
            actualQuantity: 0,
            unit: "件",
            notes: "無",
            plannedStartTime: new Date().toISOString(),
            plannedEndTime: new Date(new Date().getTime() + 86400000).toISOString() // 假設一天後結束
        };
        setWorkLoads(prev => [...prev, newLoad]);
    };

    const getAvailableStepOrders = (): number[] => {
        if (!selectedWorkTypeId) return [1];

        const usedOrders = new Set(
            workFlows
                .filter(flow => flow.workTypeId === selectedWorkTypeId)
                .flatMap(flow => flow.steps.map(step => step.order))
        );

        const maxOrder = Math.max(0, ...Array.from(usedOrders));
        return [maxOrder + 1];
    };

    const filteredWorkFlows = selectedWorkTypeId
        ? workFlows.filter(flow => flow.workTypeId === selectedWorkTypeId)
        : [];

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作種類模板</h1>

                {/* 新增工作種類區域 */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={newWorkTypeTitle}
                        onChange={e => setNewWorkTypeTitle(e.target.value)}
                        placeholder="輸入新工作種類標題"
                        className="border p-2 mr-2"
                    />
                    <button
                        onClick={handleAddWorkType}
                        className="bg-blue-500 text-white px-4 py-2"
                    >
                        建立工作種類
                    </button>
                </div>

                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 px-4 py-2">標題</th>
                            <th className="border border-gray-300 px-4 py-2">所需技能</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workTypes.map(type => (
                            <tr key={type.typeId}>
                                <td className="border border-gray-300 px-4 py-2">{type.title}</td>
                                <td className="border border-gray-300 px-4 py-2">{type.requiredSkills.join(", ")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 工作流程管理區域 */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">工作流程管理</h2>
                    <select
                        value={selectedWorkTypeId || ""}
                        onChange={e => setSelectedWorkTypeId(e.target.value)}
                        className="border p-2 mb-4"
                    >
                        <option value="">選擇工作種類</option>
                        {workTypes.map(type => (
                            <option key={type.typeId} value={type.typeId}>
                                {type.title}
                            </option>
                        ))}
                    </select>

                    <div className="mb-4">
                        <input
                            type="text"
                            value={newStepName}
                            onChange={e => setNewStepName(e.target.value)}
                            placeholder="步驟名稱"
                            className="border p-2 mr-2"
                        />
                        <select
                            value={newStepOrder}
                            onChange={e => setNewStepOrder(Number(e.target.value))}
                            className="border p-2 mr-2"
                        >
                            {getAvailableStepOrders().map(order => (
                                <option key={order} value={order}>
                                    {order}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={newStepSkills}
                            onChange={e => setNewStepSkills(e.target.value)}
                            placeholder="所需技能 (以逗號分隔)"
                            className="border p-2 mr-2"
                        />
                        <button
                            onClick={handleAddStep}
                            className="bg-blue-500 text-white px-4 py-2"
                        >
                            新增步驟
                        </button>
                    </div>

                    {/* 不顯示流程內容 */}
                    {!selectedWorkTypeId && (
                        <table className="table-auto w-full border-collapse border border-gray-300">
                            <thead>
                                <tr>
                                    <th className="border border-gray-300 px-4 py-2">工作種類</th>
                                    <th className="border border-gray-300 px-4 py-2">步驟名稱</th>
                                    <th className="border border-gray-300 px-4 py-2">順序</th>
                                    <th className="border border-gray-300 px-4 py-2">所需技能</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWorkFlows.map(flow =>
                                    flow.steps.map(step => (
                                        <tr key={`${flow.flowId}-${step.order}`}>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {workTypes.find(type => type.typeId === flow.workTypeId)?.title || "未知"}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">{step.stepName}</td>
                                            <td className="border border-gray-300 px-4 py-2">{step.order}</td>
                                            <td className="border border-gray-300 px-4 py-2">{step.requiredSkills.join(", ")}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 工作項目區域 */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">工作項目</h2>
                    <button
                        onClick={handleAddWorkItem}
                        className="bg-blue-500 text-white px-4 py-2 mb-4"
                    >
                        新增工作項目
                    </button>
                    <table className="table-auto w-full border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                <th className="border border-gray-300 px-4 py-2">項目 ID</th>
                                <th className="border border-gray-300 px-4 py-2">當前步驟</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workItems.map(item => (
                                <tr key={item.itemId}>
                                    <td className="border border-gray-300 px-4 py-2">{item.itemId}</td>
                                    <td className="border border-gray-300 px-4 py-2">{item.currentStep}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 工作任務區域 */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">工作任務</h2>
                    <button
                        onClick={handleAddWorkTask}
                        className="bg-blue-500 text-white px-4 py-2 mb-4"
                    >
                        新增工作任務
                    </button>
                    <table className="table-auto w-full border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                <th className="border border-gray-300 px-4 py-2">任務 ID</th>
                                <th className="border border-gray-300 px-4 py-2">目標數量</th>
                                <th className="border border-gray-300 px-4 py-2">已完成數量</th>
                                <th className="border border-gray-300 px-4 py-2">狀態</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workTasks.map(task => (
                                <tr key={task.taskId}>
                                    <td className="border border-gray-300 px-4 py-2">{task.taskId}</td>
                                    <td className="border border-gray-300 px-4 py-2">{task.targetQuantity}</td>
                                    <td className="border border-gray-300 px-4 py-2">{task.completedQuantity}</td>
                                    <td className="border border-gray-300 px-4 py-2">{task.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 工作量區域 */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">工作量</h2>
                    <button
                        onClick={handleAddWorkLoad}
                        className="bg-blue-500 text-white px-4 py-2 mb-4"
                    >
                        新增工作量
                    </button>
                    <table className="table-auto w-full border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                <th className="border border-gray-300 px-4 py-2">工作量 ID</th>
                                <th className="border border-gray-300 px-4 py-2">執行人</th>
                                <th className="border border-gray-300 px-4 py-2">計畫完成量</th>
                                <th className="border border-gray-300 px-4 py-2">實際完成量</th>
                                <th className="border border-gray-300 px-4 py-2">備註</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workLoads.map(load => (
                                <tr key={load.loadId}>
                                    <td className="border border-gray-300 px-4 py-2">{load.loadId}</td>
                                    <td className="border border-gray-300 px-4 py-2">{load.executor}</td>
                                    <td className="border border-gray-300 px-4 py-2">{load.plannedQuantity}</td>
                                    <td className="border border-gray-300 px-4 py-2">{load.actualQuantity}</td>
                                    <td className="border border-gray-300 px-4 py-2">{load.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
            <GlobalBottomNav />
        </>
    );
};

export default WorkTemplatePage;
