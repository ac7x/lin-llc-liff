"use client";

import {
    getAllWorkEpics,
    updateWorkEpic,
    WorkEpicEntity
} from "@/app/actions/workepic.action";
import {
    addWorkFlow,
    getAllWorkFlows,
    WorkFlow
} from "@/app/actions/workflow.action";
import {
    getAllWorkLoads,
    WorkLoadEntity
} from "@/app/actions/workload.action";
import {
    getAllWorkTasks,
    WorkTaskEntity
} from "@/app/actions/worktask.action";
import {
    addWorkType,
    getAllWorkTypes,
    WorkType
} from "@/app/actions/worktype.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import React, { useEffect, useState } from "react";

// 將下拉選單抽成簡單元件，減少重複
const Select = ({ value, onChange, options, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; placeholder: string }) => (
    <select value={value} onChange={onChange} className="border p-2 mb-4 block">
        <option value="">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
)

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
    const [selectedWorkFlowIds] = useState<string[]>([]);
    const [selectedWorkTaskId, setSelectedWorkTaskId] = useState<string | null>(null);
    const [selectedWorkLoadId, setSelectedWorkLoadId] = useState<string | null>(null);
    const [showValidationError, setShowValidationError] = useState(false);
    const [flowQuantities, setFlowQuantities] = useState<{ [flowId: string]: number }>({});
    const [workloadCounts, setWorkloadCounts] = useState<{ [taskId: string]: number }>({});

    useEffect(() => {
        const fetchData = async () => {
            setWorkTypes(await getAllWorkTypes(true));
            setWorkFlows(await getAllWorkFlows());
            setWorkEpics(await getAllWorkEpics(false) as WorkEpicEntity[]);
            setWorkTasks(await getAllWorkTasks(false) as WorkTaskEntity[]);
            setWorkLoads(await getAllWorkLoads(false) as WorkLoadEntity[]);
        };
        fetchData();
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
        if (
            !selectedWorkEpicId ||
            !selectedWorkTypeId ||
            selectedWorkFlowIds.length === 0 ||
            !selectedWorkTaskId ||
            !selectedWorkLoadId
        ) {
            setShowValidationError(true);
            return;
        }

        // 取得選中的工作種類、流程、任務、工作量
        const selectedType = workTypes.find(type => type.typeId === selectedWorkTypeId);
        const selectedFlows = workFlows.filter(flow => selectedWorkFlowIds.includes(flow.flowId));
        const selectedTask = workTasks.find(task => task.taskId === selectedWorkTaskId);
        const selectedLoad = workLoads.find(load => load.loadId === selectedWorkLoadId);
        const existingEpic = workEpics.find(epic => epic.epicId === selectedWorkEpicId);

        if (!selectedType || selectedFlows.length === 0 || !selectedTask || !selectedLoad || !existingEpic) {
            setShowValidationError(true);
            return;
        }

        // 避免與 useState 變數衝突，改名
        const updatedWorkTypes = existingEpic.workTypes ? [...existingEpic.workTypes] : [];
        if (!updatedWorkTypes.some(type => type.typeId === selectedType.typeId)) {
            updatedWorkTypes.push(selectedType);
        }

        const updatedWorkFlows = existingEpic.workFlows ? [...existingEpic.workFlows] : [];
        selectedFlows.forEach(flow => {
            if (!updatedWorkFlows.some(f => f.flowId === flow.flowId)) {
                updatedWorkFlows.push(flow);
            }
        });

        const updatedWorkTasks = existingEpic.workTasks ? [...existingEpic.workTasks] : [];
        if (!updatedWorkTasks.some(task => task.taskId === selectedTask.taskId)) {
            updatedWorkTasks.push(selectedTask);
        }

        const updatedWorkLoads = existingEpic.workLoads ? [...existingEpic.workLoads] : [];
        if (!updatedWorkLoads.some(load => load.loadId === selectedLoad.loadId)) {
            updatedWorkLoads.push(selectedLoad);
        }

        const updates: Partial<WorkEpicEntity> = {
            workTypes: updatedWorkTypes,
            workFlows: updatedWorkFlows,
            workTasks: updatedWorkTasks,
            workLoads: updatedWorkLoads
        };

        await updateWorkEpic(selectedWorkEpicId, updates);
    };

    // 根據所選流程過濾工作任務
    const filteredTasks = selectedWorkFlowIds.length > 0
        ? workTasks // 目前暫以全部顯示，請根據實際需求調整
        : workTasks;

    // 將選項資料轉換為 Select 元件格式
    const epicOptions = workEpics.map(e => ({ value: e.epicId, label: e.title }));
    const typeOptions = workTypes.map(t => ({ value: t.typeId, label: t.title }));
    const taskOptions = filteredTasks.map(t => ({ value: t.taskId, label: t.taskId }));
    const loadOptions = workLoads.map(l => ({ value: l.loadId, label: l.loadId }));

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作種類模板</h1>

                {/* 建立工作種類 */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={newWorkTypeTitle}
                        onChange={e => setNewWorkTypeTitle(e.target.value)}
                        placeholder="輸入新工作種類標題"
                        className="border p-2 mr-2"
                    />
                    <button onClick={handleAddWorkType} className="bg-blue-500 text-white px-4 py-2">
                        建立工作種類
                    </button>
                </div>

                {/* 顯示工作種類 */}
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

                {/* 建立流程步驟 */}
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
                        <button onClick={handleAddStep} className="bg-blue-500 text-white px-4 py-2">
                            新增步驟
                        </button>
                    </div>

                    {/* 顯示流程步驟 */}
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
                                .flatMap(flow =>
                                    flow.steps.map(step => ({
                                        ...step,
                                        workTypeTitle: workTypes.find(type => type.typeId === flow.workTypeId)?.title || "未知"
                                    }))
                                )
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

                {/* 加入到工作標的 */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">將工作項目加入現有的工作標的</h2>
                    <Select value={selectedWorkEpicId || ""} onChange={e => setSelectedWorkEpicId(e.target.value)} options={epicOptions} placeholder="選擇工作標的" />
                    <Select value={selectedWorkTypeId || ""} onChange={e => { setSelectedWorkTypeId(e.target.value); setFlowQuantities({}); }} options={typeOptions} placeholder="選擇工作種類" />
                    {/* 流程列表與數量輸入 */}
                    {selectedWorkTypeId && (
                        <div className="mb-4">
                            <h4 className="font-bold mb-2">對應流程、數量與分割筆數</h4>
                            {filteredFlows.length === 0 && <div className="text-gray-500">此種類尚無流程</div>}
                            {filteredFlows.map(flow => (
                                <div key={flow.flowId} className="flex items-center mb-2 gap-2">
                                    <span className="flex-1">流程ID: {flow.flowId}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={flowQuantities[flow.flowId] || ''}
                                        onChange={e => {
                                            const val = parseInt(e.target.value, 10) || 0;
                                            setFlowQuantities(q => ({ ...q, [flow.flowId]: val }));
                                        }}
                                        className="border p-1 w-24"
                                        placeholder="數量"
                                    />
                                    <label className="ml-2">分割：</label>
                                    <select
                                        className="border p-1 w-20"
                                        value={workloadCounts[flow.flowId] || 1}
                                        onChange={e => {
                                            const val = parseInt(e.target.value, 10) || 1;
                                            setWorkloadCounts(prev => ({ ...prev, [flow.flowId]: val }));
                                        }}
                                    >
                                        {[...Array(10)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1} 筆</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}
                    <Select value={selectedWorkTaskId || ""} onChange={e => setSelectedWorkTaskId(e.target.value)} options={taskOptions} placeholder="選擇工作任務" />
                    <Select value={selectedWorkLoadId || ""} onChange={e => setSelectedWorkLoadId(e.target.value)} options={loadOptions} placeholder="選擇工作量" />
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