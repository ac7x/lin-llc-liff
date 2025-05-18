"use client";

import { getAllWorkEpics, updateWorkEpic, WorkEpicEntity } from "@/app/actions/workepic.action";
import { addWorkFlow, getAllWorkFlows, WorkFlow } from "@/app/actions/workflow.action";
import { getAllWorkLoads, WorkLoadEntity } from "@/app/actions/workload.action";
import { getAllWorkTasks, WorkTaskEntity } from "@/app/actions/worktask.action";
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
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [selectedWorkEpicId, setSelectedWorkEpicId] = useState<string | null>(null);
    const [workTasks, setWorkTasks] = useState<WorkTaskEntity[]>([]);
    const [workLoads, setWorkLoads] = useState<WorkLoadEntity[]>([]);
    const [selectedWorkFlowId, setSelectedWorkFlowId] = useState<string | null>(null);
    const [selectedWorkTaskId, setSelectedWorkTaskId] = useState<string | null>(null);
    const [selectedWorkLoadId, setSelectedWorkLoadId] = useState<string | null>(null);
    const [showValidationError, setShowValidationError] = useState(false);

    useEffect(() => {
        const fetchWorkTypes = async () => {
            const types = await getAllWorkTypes(true);
            setWorkTypes(types);
        };
        fetchWorkTypes();
    }, []);

    useEffect(() => {
        const fetchWorkFlows = async () => {
            const flows = await getAllWorkFlows();
            setWorkFlows(flows);
        };
        fetchWorkFlows();
    }, []);

    useEffect(() => {
        const fetchWorkEpics = async () => {
            const epics = await getAllWorkEpics(false);
            setWorkEpics(epics as WorkEpicEntity[]);
        };
        fetchWorkEpics();
    }, []);

    useEffect(() => {
        const fetchWorkTasks = async () => {
            const tasks = await getAllWorkTasks(false);
            setWorkTasks(tasks as WorkTaskEntity[]);
        };
        fetchWorkTasks();
    }, []);

    useEffect(() => {
        const fetchWorkLoads = async () => {
            const loads = await getAllWorkLoads(false);
            setWorkLoads(loads as WorkLoadEntity[]);
        };
        fetchWorkLoads();
    }, []);

    const filteredFlows = selectedWorkTypeId
        ? workFlows.filter(flow => flow.workTypeId === selectedWorkTypeId)
        : [];

    const allSteps = filteredFlows.flatMap(flow => flow.steps);

    const maxOrder = allSteps.length > 0 ? Math.max(...allSteps.map(step => step.order)) : 0;

    useEffect(() => {
        if (selectedWorkTypeId) {
            setNewStepOrder(maxOrder + 1);
        }
    }, [selectedWorkTypeId, workFlows, maxOrder]);

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

        const existingOrders = allSteps.map(step => step.order);
        for (let i = 1; i < newStepOrder; i++) {
            if (!existingOrders.includes(i)) {
                alert(`請先建立第 ${i} 步`);
                return;
            }
        }

        if (existingOrders.includes(newStepOrder)) {
            alert(`第 ${newStepOrder} 步已存在！`);
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
        setNewStepSkills("");
        setNewStepOrder(prev => prev + 1);
    };

    const handleAddToWorkEpic = async () => {
        if (!selectedWorkEpicId || !selectedWorkTypeId || !selectedWorkFlowId || !selectedWorkTaskId || !selectedWorkLoadId) {
            setShowValidationError(true);
            return;
        }

        const selectedWorkType = workTypes.find(type => type.typeId === selectedWorkTypeId);
        const selectedWorkFlow = workFlows.find(flow => flow.flowId === selectedWorkFlowId);
        const selectedWorkTask = workTasks.find(task => task.taskId === selectedWorkTaskId);
        const selectedWorkLoad = workLoads.find(load => load.loadId === selectedWorkLoadId);

        if (!selectedWorkType || !selectedWorkFlow || !selectedWorkTask || !selectedWorkLoad) {
            setShowValidationError(true);
            return;
        }

        const existingEpic = workEpics.find(epic => epic.epicId === selectedWorkEpicId);

        if (!existingEpic) {
            setShowValidationError(true);
            return;
        }

        const updates: Partial<WorkEpicEntity> = {
            workTypes: [...(existingEpic.workTypes || []), selectedWorkType],
            workFlows: [...(existingEpic.workFlows || []), selectedWorkFlow],
            workTasks: [...(existingEpic.workTasks || []), selectedWorkTask],
            workLoads: [...(existingEpic.workLoads || []), selectedWorkLoad]
        };

        await updateWorkEpic(selectedWorkEpicId, updates);
        setWorkEpics(prev => prev.map(epic => epic.epicId === selectedWorkEpicId ? { ...epic, ...updates } : epic));
        setShowValidationError(false);
    };

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作種類模板</h1>

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
                        <input
                            type="number"
                            value={newStepOrder}
                            onChange={e => setNewStepOrder(Number(e.target.value))}
                            placeholder="順序"
                            className="border p-2 mr-2"
                        />
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
                            {filteredFlows
                                .flatMap(flow => flow.steps.map(step => ({
                                    ...step,
                                    workTypeTitle: workTypes.find(type => type.typeId === flow.workTypeId)?.title || "未知"
                                })))
                                .sort((a, b) => a.order - b.order)
                                .map((step, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-300 px-4 py-2">{step.workTypeTitle}</td>
                                        <td className="border border-gray-300 px-4 py-2">{step.stepName}</td>
                                        <td className="border border-gray-300 px-4 py-2">{step.order}</td>
                                        <td className="border border-gray-300 px-4 py-2">{step.requiredSkills.join(", ")}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">將工作種類、工作流程、工作任務和工作量加入現有的工作標的</h2>
                    {/* 新增選擇欄位 */}
                    <select
                        value={selectedWorkEpicId || ""}
                        onChange={e => setSelectedWorkEpicId(e.target.value)}
                        className="border p-2 mb-4 block"
                    >
                        <option value="">選擇工作標的</option>
                        {workEpics.map(epic => (
                            <option key={epic.epicId} value={epic.epicId}>
                                {epic.title}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedWorkTypeId || ""}
                        onChange={e => setSelectedWorkTypeId(e.target.value)}
                        className="border p-2 mb-4 block"
                    >
                        <option value="">選擇工作種類</option>
                        {workTypes.map(type => (
                            <option key={type.typeId} value={type.typeId}>
                                {type.title}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedWorkFlowId || ""}
                        onChange={e => setSelectedWorkFlowId(e.target.value)}
                        className="border p-2 mb-4 block"
                    >
                        <option value="">選擇工作流程</option>
                        {workFlows
                            .filter(flow => !selectedWorkTypeId || flow.workTypeId === selectedWorkTypeId)
                            .map(flow => (
                                <option key={flow.flowId} value={flow.flowId}>
                                    {flow.flowId}
                                </option>
                            ))}
                    </select>
                    <select
                        value={selectedWorkTaskId || ""}
                        onChange={e => setSelectedWorkTaskId(e.target.value)}
                        className="border p-2 mb-4 block"
                    >
                        <option value="">選擇工作任務</option>
                        {workTasks.map(task => (
                            <option key={task.taskId} value={task.taskId}>
                                {task.taskId}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedWorkLoadId || ""}
                        onChange={e => setSelectedWorkLoadId(e.target.value)}
                        className="border p-2 mb-4 block"
                    >
                        <option value="">選擇工作量</option>
                        {workLoads.map(load => (
                            <option key={load.loadId} value={load.loadId}>
                                {load.loadId}
                            </option>
                        ))}
                    </select>
                    {/* 驗證提示訊息 */}
                    {showValidationError && (
                        <div className="text-red-500 mb-2">請確保所有項目都已選擇！</div>
                    )}
                    <button
                        onClick={handleAddToWorkEpic}
                        className="bg-green-500 text-white px-4 py-2"
                    >
                        加入工作標的
                    </button>
                </div>
            </main>
            <GlobalBottomNav />
        </>
    );
};

export default WorkTemplatePage;
