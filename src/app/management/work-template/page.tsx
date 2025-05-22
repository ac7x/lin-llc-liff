"use client";
import { getAllWorkEpics, updateWorkEpic, WorkEpicEntity } from '@/app/actions/workepic.action';
import { addWorkFlow, getAllWorkFlows, WorkFlowEntity } from '@/app/actions/workflow.action';
import { WorkLoadEntity } from '@/app/actions/workload.action';
import { WorkTaskEntity } from '@/app/actions/worktask.action';
import { addWorkType, getAllWorkTypes, WorkTypeEntity } from '@/app/actions/worktype.action';
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import React, { useEffect, useState } from "react";

const WorkTemplatePage: React.FC = () => {
    // 工作種類
    const [workTypes, setWorkTypes] = useState<WorkTypeEntity[]>([]);
    const [newWorkTypeTitle, setNewWorkTypeTitle] = useState("");
    // 工作流程
    const [workFlows, setWorkFlows] = useState<WorkFlowEntity[]>([]);
    const [selectedWorkTypeId, setSelectedWorkTypeId] = useState("");
    const [newStepName, setNewStepName] = useState("");
    const [newStepOrder, setNewStepOrder] = useState(1);
    const [newStepSkills, setNewStepSkills] = useState("");
    // Epic 操作
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [selectedWorkEpicId, setSelectedWorkEpicId] = useState("");
    const [selectedWorkFlowIds, setSelectedWorkFlowIds] = useState<string[]>([]);
    const [flowQuantities, setFlowQuantities] = useState<{ [k: string]: number }>({});
    const [workloadCounts, setWorkloadCounts] = useState<{ [k: string]: number }>({});
    const [showValidationError, setShowValidationError] = useState(false);

    // 載入所有基礎資料
    useEffect(() => {
        (async () => {
            const [types, flows, epics] = await Promise.all([
                getAllWorkTypes(true),
                getAllWorkFlows(true),
                getAllWorkEpics(false)
            ]);
            setWorkTypes(types as WorkTypeEntity[]);
            setWorkFlows(flows as WorkFlowEntity[]);
            setWorkEpics(epics as WorkEpicEntity[]);
        })();
    }, []);

    // 新增工作種類
    async function handleAddWorkType() {
        const title = newWorkTypeTitle.trim();
        if (!title) return alert("請輸入標題！");
        const newWorkType: WorkTypeEntity = { typeId: `type-${Date.now()}`, title, requiredSkills: [] };
        await addWorkType(newWorkType);
        setWorkTypes(prev => [...prev, newWorkType]);
        setNewWorkTypeTitle("");
    }

    // 新增步驟
    async function handleAddStep() {
        if (!selectedWorkTypeId || !newStepName.trim()) return alert("請選擇種類與步驟名稱！");
        // 找出已存在的 order
        const steps = workFlows.filter(f => f.workTypeId === selectedWorkTypeId).flatMap(f => f.steps);
        const existingOrders = steps.map(s => s.order);
        if (existingOrders.includes(newStepOrder)) return alert(`第${newStepOrder}步已存在`);
        const newFlow: WorkFlowEntity = {
            flowId: `flow-${Date.now()}`,
            workTypeId: selectedWorkTypeId,
            steps: [{
                stepName: newStepName,
                order: newStepOrder,
                requiredSkills: newStepSkills.split(",").map(s => s.trim()).filter(Boolean)
            }]
        };
        await addWorkFlow(newFlow);
        setWorkFlows(prev => [...prev, newFlow]);
        setNewStepName("");
        setNewStepSkills("");
        setNewStepOrder(newStepOrder + 1);
    }

    // Epic 加入工作流程
    async function handleAddToWorkEpic() {
        if (!selectedWorkEpicId || !selectedWorkTypeId || selectedWorkFlowIds.length === 0) {
            setShowValidationError(true);
            return;
        }
        const epic = workEpics.find(e => e.epicId === selectedWorkEpicId);
        const type = workTypes.find(t => t.typeId === selectedWorkTypeId);
        const flows = workFlows.filter(f => selectedWorkFlowIds.includes(f.flowId));
        if (!epic || !type || flows.length === 0) return setShowValidationError(true);
        const now = Date.now();
        const tasks: WorkTaskEntity[] = [];
        const loads: WorkLoadEntity[] = [];
        flows.forEach((flow, idx) => {
            const qty = flowQuantities[flow.flowId] || 1;
            const split = workloadCounts[flow.flowId] || 1;
            const stepName = flow.steps[0]?.stepName || "";
            const taskId = `task-${epic.epicId}-${idx}-${now}`;
            tasks.push({
                taskId, flowId: flow.flowId, targetQuantity: qty, unit: '單位',
                completedQuantity: 0, status: '待分配', title: `${epic.title}-${type.title}-${stepName}`
            });
            for (let j = 0; j < split; j++) {
                loads.push({
                    loadId: `load-${epic.epicId}-${idx}-${j}-${now}`,
                    taskId, plannedQuantity: Math.floor(qty / split), unit: "單位",
                    plannedStartTime: "", plannedEndTime: "", actualQuantity: 0, executor: [],
                    title: `${epic.title}-${type.title}-${stepName}-${j + 1}`, epicIds: [epic.epicId]
                });
            }
        });
        await updateWorkEpic(selectedWorkEpicId, {
            workTypes: [...(epic.workTypes || []), type],
            workFlows: [...(epic.workFlows || []), ...flows],
            workTasks: [...(epic.workTasks || []), ...tasks],
            workLoads: [...(epic.workLoads || []), ...loads]
        });
        setShowValidationError(false);
    }

    // 對應 options
    const epicOptions = workEpics.map(e => <option value={e.epicId} key={e.epicId}>{e.title}</option>);
    const typeOptions = workTypes.map(t => <option value={t.typeId} key={t.typeId}>{t.title}</option>);
    const filteredFlows = workFlows.filter(f => f.workTypeId === selectedWorkTypeId);

    return (
        <>
            <main className="p-4">
                <h1 className="text-xl font-bold mb-2">工作種類模板</h1>
                {/* 新增種類 */}
                <div>
                    <input value={newWorkTypeTitle} onChange={e => setNewWorkTypeTitle(e.target.value)} placeholder="新種類標題" className="border p-1 mr-2" />
                    <button onClick={handleAddWorkType} className="bg-blue-500 text-white px-2 py-1">新增</button>
                </div>
                <ul>
                    {workTypes.map(t => <li key={t.typeId}>{t.title}</li>)}
                </ul>

                {/* 新增步驟 */}
                <h2 className="font-bold mt-6 mb-2">流程管理</h2>
                <select value={selectedWorkTypeId} onChange={e => setSelectedWorkTypeId(e.target.value)} className="border p-1 mb-2">
                    <option value="">選擇種類</option>{typeOptions}
                </select>
                <div>
                    <input value={newStepName} onChange={e => setNewStepName(e.target.value)} placeholder="步驟名稱" className="border p-1 mr-1" />
                    <input type="number" value={newStepOrder} min={1} onChange={e => setNewStepOrder(Number(e.target.value))} className="border w-16 p-1 mr-1" />
                    <input value={newStepSkills} onChange={e => setNewStepSkills(e.target.value)} placeholder="技能(逗號)" className="border p-1 mr-1" />
                    <button onClick={handleAddStep} className="bg-blue-500 text-white px-2 py-1">新增步驟</button>
                </div>
                <ul>
                    {filteredFlows.map(f =>
                        <li key={f.flowId}>
                            {f.steps.map(s => (
                                <div key={s.stepName}>{s.order}. {s.stepName} [{s.requiredSkills.join(",")}]</div>
                            ))}
                        </li>
                    )}
                </ul>

                {/* Epic 加入流程 */}
                <h2 className="font-bold mt-6 mb-2">加入工作標的</h2>
                <select value={selectedWorkEpicId} onChange={e => setSelectedWorkEpicId(e.target.value)} className="border p-1 mb-2">
                    <option value="">選擇標的</option>{epicOptions}
                </select>
                <select value={selectedWorkTypeId} onChange={e => { setSelectedWorkTypeId(e.target.value); setSelectedWorkFlowIds([]); }} className="border p-1 mb-2">
                    <option value="">選擇種類</option>{typeOptions}
                </select>
                <div>
                    {filteredFlows.map(f => (
                        <div key={f.flowId}>
                            <input
                                type="checkbox"
                                checked={selectedWorkFlowIds.includes(f.flowId)}
                                onChange={e => {
                                    setSelectedWorkFlowIds(ids =>
                                        e.target.checked ? [...ids, f.flowId] : ids.filter(id => id !== f.flowId)
                                    );
                                }}
                            />
                            <span>{f.steps[0]?.stepName || ""}</span>
                            <input
                                type="number"
                                value={flowQuantities[f.flowId] || ""}
                                min={1}
                                onChange={e => setFlowQuantities(q => ({ ...q, [f.flowId]: Number(e.target.value) }))}
                                placeholder="數量"
                                className="border w-16 mx-1"
                            />
                            <input
                                type="number"
                                value={workloadCounts[f.flowId] || 1}
                                min={1}
                                onChange={e => setWorkloadCounts(c => ({ ...c, [f.flowId]: Number(e.target.value) || 1 }))}
                                placeholder="分割"
                                className="border w-12"
                            />
                        </div>
                    ))}
                </div>
                {showValidationError && <div className="text-red-500">請確保所有項目都已選擇！</div>}
                <button onClick={handleAddToWorkEpic} className="bg-green-500 text-white px-3 py-1 mt-2">加入標的</button>
            </main>
            <ManagementBottomNav />
        </>
    );
};

export default WorkTemplatePage;