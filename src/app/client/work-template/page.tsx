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
    addWorkLoad // ← 加入這行
    ,











    WorkLoadEntity
} from "@/app/actions/workload.action";
import {
    addWorkTask // ← 加入這行
    ,











    WorkTaskEntity
} from "@/app/actions/worktask.action";
import {
    addWorkType,
    getAllWorkTypes,
    WorkTypeEntity
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
    const [workTypes, setWorkTypes] = useState<WorkTypeEntity[]>([]);
    const [newWorkTypeTitle, setNewWorkTypeTitle] = useState("");
    const [workFlows, setWorkFlows] = useState<WorkFlowEntity[]>([]);
    const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string | null>(null);
    const [newStepName, setNewStepName] = useState("");
    const [newStepOrder, setNewStepOrder] = useState<number>(1);
    const [newStepSkills, setNewStepSkills] = useState<string>("");
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [selectedWorkEpicId, setSelectedWorkEpicId] = useState<string | null>(null);
    const [selectedWorkFlowIds, setSelectedWorkFlowIds] = useState<string[]>([]);
    const [showValidationError, setShowValidationError] = useState(false);
    const [flowQuantities, setFlowQuantities] = useState<{ [flowId: string]: number }>({});
    const [workloadCounts, setWorkloadCounts] = useState<{ [taskId: string]: number }>({});

    useEffect(() => {
        const fetchData = async () => {
            setWorkTypes(await getAllWorkTypes(true) as WorkTypeEntity[]);
            setWorkFlows(await getAllWorkFlows(true) as WorkFlowEntity[]);
            setWorkEpics(await getAllWorkEpics(false) as WorkEpicEntity[]);
        };
        fetchData();
    }, []);

    const filteredFlows = selectedWorkTypeId
        ? workFlows.filter(flow => flow.workTypeId === selectedWorkTypeId)
        : [];

    // 取得所有步驟
    const allSteps = filteredFlows.flatMap(flow => flow.steps);
    // 取得目前最大順序
    const maxOrder = allSteps.length > 0 ? Math.max(...allSteps.map(step => step.order)) : 0;

    useEffect(() => {
        if (selectedWorkTypeId) {
            // 每次選擇種類時，預設順序為最大+1
            setNewStepOrder(maxOrder + 1);
        }
    }, [selectedWorkTypeId, maxOrder]);

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
            alert("請輸入工作種類標題！");
            return;
        }

        // 取得目前所有步驟順序
        const existingOrders = allSteps.map(step => step.order);
        // 檢查 1~(newStepOrder-1) 是否都存在
        for (let i = 1; i < newStepOrder; i++) {
            if (!existingOrders.includes(i)) {
                alert(`請先建立第 ${i} 步`);
                return;
            }
        }

        // 檢查 newStepOrder 是否已存在
        if (existingOrders.includes(newStepOrder)) {
            alert(`第 ${newStepOrder} 步已存在！`);
            return;
        }

        // 取得種類名稱
        const type = workTypes.find(t => t.typeId === selectedWorkTypeId);
        const typeTitle = type ? type.title : '未知';

        // flowId 改為 flow-種類-順序
        const newFlowId = `flow-${typeTitle}-${newStepOrder}`;

        const newFlow: WorkFlowEntity = {
            flowId: newFlowId,
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
        setNewStepName('');
        setNewStepSkills('');
        // 新增後自動設為下一步
        setNewStepOrder(newStepOrder + 1);
    };

    const handleAddToWorkEpic = async () => {
        if (
            !selectedWorkEpicId ||
            !selectedWorkTypeId ||
            selectedWorkFlowIds.length === 0
        ) {
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

        // 產生任務與工作量
        const newTasks: WorkTaskEntity[] = [];
        const newLoads: WorkLoadEntity[] = [];
        selectedFlows.forEach(flow => {
            const quantity = flowQuantities[flow.flowId] || 1;
            const split = workloadCounts[flow.flowId] || 1;
            // 只產生一筆 task
            const taskId = `task-${flow.flowId}-${Date.now()}`;
            const task: WorkTaskEntity = {
                taskId,
                itemId: flow.flowId,
                targetQuantity: quantity,
                unit: "單位",
                completedQuantity: 0,
                status: "待分配"
            };
            newTasks.push(task);

            // 只依 split 產生 load
            for (let j = 0; j < split; j++) {
                const loadId = `load-${taskId}-${j}`;
                const load: WorkLoadEntity = {
                    loadId,
                    taskId,
                    plannedQuantity: 0,
                    unit: "單位",
                    plannedStartTime: "",
                    plannedEndTime: "",
                    actualQuantity: 0, // 確保有 actualQuantity
                    executor: "",      // 確保有 executor
                };
                newLoads.push(load);
            }
        });

        // 寫入資料庫
        await Promise.all([
            ...newTasks.map(task => addWorkTask(task)),
            ...newLoads.map(load => addWorkLoad(load))
        ]);

        // 更新標的
        const updates: Partial<WorkEpicEntity> = {
            workTypes: [...(existingEpic.workTypes || []), selectedType],
            workFlows: [...(existingEpic.workFlows || []), ...selectedFlows],
            workTasks: [...(existingEpic.workTasks || []), ...newTasks],
            workLoads: [...(existingEpic.workLoads || []), ...newLoads]
        };
        await updateWorkEpic(selectedWorkEpicId, updates);
    };

    const epicOptions = workEpics.map(e => ({ value: e.epicId, label: e.title }));
    const typeOptions = workTypes.map(t => ({ value: t.typeId, label: t.title }));

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
                            {/* 全選功能 */}
                            {filteredFlows.length > 0 && (
                                <div className="flex items-center mb-2">
                                    {/*
                                        需用 ref 設定 indeterminate
                                    */}
                                    <input
                                        type="checkbox"
                                        checked={filteredFlows.every(flow => selectedWorkFlowIds.includes(flow.flowId))}
                                        ref={el => {
                                            if (el) {
                                                el.indeterminate =
                                                    selectedWorkFlowIds.length > 0 &&
                                                    selectedWorkFlowIds.length < filteredFlows.length;
                                            }
                                        }}
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