"use client";

import {
    getAllWorkEpics,
    updateWorkEpic,
    WorkEpicEntity
} from "@/app/actions/workepic.action";
import {
    addWorkFlow,
    getAllWorkFlows,
    WorkFlowEntity
} from "@/app/actions/workflow.action";
import {
    addWorkLoad,
    WorkLoadEntity
} from "@/app/actions/workload.action";
import {
    addWorkTask,
    WorkTaskEntity
} from "@/app/actions/worktask.action";
import {
    addWorkType,
    getAllWorkTypes,
    WorkTypeEntity
} from "@/app/actions/worktype.action";
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import React, { useEffect, useRef, useState } from "react";

/** 通用下拉選單元件 */
const Select: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    placeholder: string;
}> = ({ value, onChange, options, placeholder }) => (
    <select value={value} onChange={onChange} className="border p-2 mb-4 block">
        <option value="">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);

/** 單行數值輸入元件 */
const NumberInput: React.FC<{
    value: number | string;
    onChange: (val: number) => void;
    placeholder?: string;
    min?: number;
    className?: string;
}> = ({ value, onChange, placeholder = "", min = 0, className = "" }) => (
    <input
        type="number"
        value={value}
        min={min}
        onChange={e => onChange(Math.max(min, parseInt(e.target.value) || min))}
        placeholder={placeholder}
        className={className}
    />
);

/** 顯示工作種類資料表 */
const WorkTypesTable: React.FC<{ types: WorkTypeEntity[] }> = ({ types }) => (
    <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
            <tr>
                <th className="border border-gray-300 px-4 py-2">標題</th>
                <th className="border border-gray-300 px-4 py-2">所需技能</th>
            </tr>
        </thead>
        <tbody>
            {types.map(type => (
                <tr key={type.typeId}>
                    <td className="border border-gray-300 px-4 py-2">{type.title}</td>
                    <td className="border border-gray-300 px-4 py-2">{type.requiredSkills.join(", ")}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

/** 顯示步驟資料表 */
const StepsTable: React.FC<{ flows: WorkFlowEntity[], types: WorkTypeEntity[] }> = ({ flows, types }) => (
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
            {flows
                .flatMap(flow =>
                    flow.steps.map(step => ({
                        ...step,
                        workTypeTitle: types.find(type => type.typeId === flow.workTypeId)?.title || "未知"
                    }))
                )
                .sort((a, b) => a.order - b.order)
                .map((step, idx) => (
                    <tr key={idx}>
                        <td className="border border-gray-300 px-4 py-2">{step.workTypeTitle}</td>
                        <td className="border border-gray-300 px-4 py-2">{step.stepName}</td>
                        <td className="border border-gray-300 px-4 py-2">{step.order}</td>
                        <td className="border border-gray-300 px-4 py-2">{Array.isArray(step.requiredSkills) ? step.requiredSkills.join(', ') : step.requiredSkills}</td>
                    </tr>
                ))}
        </tbody>
    </table>
);

const WorkTemplatePage: React.FC = () => {
    // 狀態
    const [workTypes, setWorkTypes] = useState<WorkTypeEntity[]>([]);
    const [newWorkTypeTitle, setNewWorkTypeTitle] = useState("");
    const [workFlows, setWorkFlows] = useState<WorkFlowEntity[]>([]);
    const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string>("");
    const [newStepName, setNewStepName] = useState("");
    const [newStepOrder, setNewStepOrder] = useState<number>(1);
    const [newStepSkills, setNewStepSkills] = useState("");
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [selectedWorkEpicId, setSelectedWorkEpicId] = useState<string>("");
    const [selectedWorkFlowIds, setSelectedWorkFlowIds] = useState<string[]>([]);
    const [showValidationError, setShowValidationError] = useState(false);
    const [flowQuantities, setFlowQuantities] = useState<{ [flowId: string]: number }>({});
    const [workloadCounts, setWorkloadCounts] = useState<{ [taskId: string]: number }>({});

    // 全選 checkbox ref
    const selectAllRef = useRef<HTMLInputElement>(null);

    /** 載入所有資料 */
    useEffect(() => {
        (async () => {
            setWorkTypes(await getAllWorkTypes(true) as WorkTypeEntity[]);
            setWorkFlows(await getAllWorkFlows(true) as WorkFlowEntity[]);
            setWorkEpics(await getAllWorkEpics(false) as WorkEpicEntity[]);
        })();
    }, []);

    // 依選種類過濾流程
    const filteredFlows = selectedWorkTypeId
        ? workFlows.filter(flow => flow.workTypeId === selectedWorkTypeId)
        : [];

    // 取得所有步驟
    const allSteps = filteredFlows.flatMap(flow => flow.steps);
    const maxOrder = allSteps.length > 0 ? Math.max(...allSteps.map(step => step.order)) : 0;

    // 選擇種類自動順序
    useEffect(() => {
        if (selectedWorkTypeId) setNewStepOrder(maxOrder + 1);
    }, [selectedWorkTypeId, maxOrder]);

    /** 建立新種類 */
    const handleAddWorkType = async () => {
        if (!newWorkTypeTitle.trim()) return alert("請輸入工作種類標題！");
        const newWorkType = {
            typeId: `type-${Date.now()}`,
            title: newWorkTypeTitle,
            requiredSkills: []
        };
        await addWorkType(newWorkType);
        setWorkTypes(prev => [...prev, newWorkType]);
        setNewWorkTypeTitle("");
    };

    /** 建立新步驟 */
    const handleAddStep = async () => {
        if (!selectedWorkTypeId || !newStepName.trim()) return alert("請輸入工作種類標題！");
        const existingOrders = allSteps.map(step => step.order);
        for (let i = 1; i < newStepOrder; i++) {
            if (!existingOrders.includes(i)) return alert(`請先建立第 ${i} 步`);
        }
        if (existingOrders.includes(newStepOrder)) return alert(`第 ${newStepOrder} 步已存在！`);
        const newFlowId = `flow-${Date.now()}`;
        const newFlow: WorkFlowEntity = {
            flowId: newFlowId,
            workTypeId: selectedWorkTypeId,
            steps: [{
                stepName: newStepName,
                order: newStepOrder,
                requiredSkills: newStepSkills.split(",").map(skill => skill.trim()).filter(Boolean)
            }]
        };
        await addWorkFlow(newFlow);
        setWorkFlows(prev => [...prev, newFlow]);
        setNewStepName('');
        setNewStepSkills('');
        setNewStepOrder(newStepOrder + 1);
    };

    /** 加入到工作標的 */
    const handleAddToWorkEpic = async () => {
        if (!selectedWorkEpicId || !selectedWorkTypeId || selectedWorkFlowIds.length === 0) {
            setShowValidationError(true);
            return;
        }
        const selectedType = workTypes.find(type => type.typeId === selectedWorkTypeId);
        const selectedFlows = workFlows.filter(flow => selectedWorkFlowIds.includes(flow.flowId));
        const existingEpic = workEpics.find(epic => epic.epicId === selectedWorkEpicId);
        if (!selectedType || selectedFlows.length === 0 || !existingEpic) {
            setShowValidationError(true);
            return;
        }
        const newTasks: WorkTaskEntity[] = [];
        const newLoads: WorkLoadEntity[] = [];
        const now = Date.now();
        selectedFlows.forEach((flow, flowIdx) => {
            const quantity = flowQuantities[flow.flowId] || 1;
            const split = workloadCounts[flow.flowId] || 1;
            const stepName = flow.steps[0]?.stepName || '';
            const taskTitle = `${existingEpic.title}-${selectedType.title}-${stepName}`;
            const task: WorkTaskEntity = {
                taskId: `task-${existingEpic.epicId}-${flowIdx}-${now}`,
                flowId: flow.flowId,
                targetQuantity: quantity,
                unit: "單位",
                completedQuantity: 0,
                status: "待分配",
                title: taskTitle
            };
            newTasks.push(task);
            for (let j = 0; j < split; j++) {
                const loadTitle = `${existingEpic.title}-${selectedType.title}-${stepName}-${j + 1}`;
                const load: WorkLoadEntity = {
                    loadId: `load-${existingEpic.epicId}-${flowIdx}-${j}-${now}`,
                    taskId: task.taskId,
                    plannedQuantity: Math.floor(quantity / split),
                    unit: "單位",
                    plannedStartTime: "",
                    plannedEndTime: "",
                    actualQuantity: 0,
                    executor: [],
                    title: loadTitle
                };
                newLoads.push(load);
            }
        });
        await Promise.all([
            ...newTasks.map(task => addWorkTask(task)),
            ...newLoads.map(load => addWorkLoad(load))
        ]);
        const updates: Partial<WorkEpicEntity> = {
            workTypes: [...(existingEpic.workTypes || []), selectedType],
            workFlows: [...(existingEpic.workFlows || []), ...selectedFlows],
            workTasks: [...(existingEpic.workTasks || []), ...newTasks],
            workLoads: [...(existingEpic.workLoads || []), ...newLoads]
        };
        await updateWorkEpic(selectedWorkEpicId, updates);
    };

    // 選項
    const epicOptions = workEpics.map(e => ({ value: e.epicId, label: e.title }));
    const typeOptions = workTypes.map(t => ({ value: t.typeId, label: t.title }));

    // 全選 indeterminate
    useEffect(() => {
        const ref = selectAllRef.current;
        if (ref && filteredFlows.length > 0) {
            ref.indeterminate =
                selectedWorkFlowIds.length > 0 &&
                selectedWorkFlowIds.length < filteredFlows.length;
        }
    }, [filteredFlows, selectedWorkFlowIds]);

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作種類模板</h1>
                {/* 建立種類 */}
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
                <WorkTypesTable types={workTypes} />

                {/* 建立流程步驟 */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">工作流程管理</h2>
                    <Select
                        value={selectedWorkTypeId}
                        onChange={e => setSelectedWorkTypeId(e.target.value)}
                        options={typeOptions}
                        placeholder="選擇工作種類"
                    />
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                        <input
                            type="text"
                            value={newStepName}
                            onChange={e => setNewStepName(e.target.value)}
                            placeholder="步驟名稱"
                            className="border p-2"
                        />
                        <NumberInput
                            value={newStepOrder}
                            onChange={setNewStepOrder}
                            min={1}
                            placeholder="順序"
                            className="border p-2 w-24"
                        />
                        <input
                            type="text"
                            value={newStepSkills}
                            onChange={e => setNewStepSkills(e.target.value)}
                            placeholder="所需技能 (以逗號分隔)"
                            className="border p-2"
                        />
                        <button onClick={handleAddStep} className="bg-blue-500 text-white px-4 py-2">
                            新增步驟
                        </button>
                    </div>
                    <StepsTable flows={filteredFlows} types={workTypes} />
                </div>

                {/* 加入到工作標的 */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">將工作項目加入現有的工作標的</h2>
                    <Select value={selectedWorkEpicId} onChange={e => setSelectedWorkEpicId(e.target.value)} options={epicOptions} placeholder="選擇工作標的" />
                    <Select value={selectedWorkTypeId} onChange={e => { setSelectedWorkTypeId(e.target.value); setFlowQuantities({}); setSelectedWorkFlowIds([]); }} options={typeOptions} placeholder="選擇工作種類" />
                    {selectedWorkTypeId && (
                        <div className="mb-4">
                            <h4 className="font-bold mb-2">對應流程、數量與分割筆數</h4>
                            {filteredFlows.length > 0 && (
                                <div className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        ref={selectAllRef}
                                        checked={filteredFlows.length > 0 && filteredFlows.every(flow => selectedWorkFlowIds.includes(flow.flowId))}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setSelectedWorkFlowIds(filteredFlows.map(flow => flow.flowId));
                                            } else {
                                                setSelectedWorkFlowIds([]);
                                            }
                                        }}
                                    />
                                    <span className="ml-2">全選</span>
                                </div>
                            )}
                            {filteredFlows.length === 0 && <div className="text-gray-500">此種類尚無流程</div>}
                            {filteredFlows.map(flow => (
                                <div key={flow.flowId} className="flex items-center mb-2 gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedWorkFlowIds.includes(flow.flowId)}
                                        onChange={e => {
                                            setSelectedWorkFlowIds(ids =>
                                                e.target.checked
                                                    ? [...ids, flow.flowId]
                                                    : ids.filter(id => id !== flow.flowId)
                                            );
                                        }}
                                    />
                                    <span className="flex-1">{flow.steps[0].stepName}</span>
                                    <NumberInput
                                        value={flowQuantities[flow.flowId] || ""}
                                        onChange={val => setFlowQuantities(q => ({ ...q, [flow.flowId]: val }))}
                                        min={0}
                                        placeholder="數量"
                                        className="border p-1 w-24"
                                    />
                                    <label className="ml-2">分割：</label>
                                    <NumberInput
                                        value={workloadCounts[flow.flowId] || 1}
                                        onChange={val => setWorkloadCounts(counts => ({ ...counts, [flow.flowId]: val || 1 }))}
                                        min={1}
                                        className="border px-2 py-1 w-20"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
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
            <ManagementBottomNav />
        </>
    );
};

export default WorkTemplatePage;