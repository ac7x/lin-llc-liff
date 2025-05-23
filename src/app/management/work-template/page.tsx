"use client";
import { getAllWorkEpics, updateWorkEpic, WorkEpicEntity } from '@/app/actions/workepic.action';
import type { WorkFlowEntity } from '@/app/actions/workflow.action';
import { WorkLoadEntity } from '@/app/actions/workload.action';
import { WorkTaskEntity } from '@/app/actions/worktask.action';
import { addWorkType, getAllWorkTypes, updateWorkType, WorkTypeEntity } from '@/app/actions/worktype.action';
import type { WorkZoneEntity } from '@/app/actions/workzone.action';
import { getAllWorkZones } from '@/app/actions/workzone.action';
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';

function shortId(prefix = ''): string {
    return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}
function toISO(date: string | number | Date | undefined | null): string {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toISOString();
}

const WorkTemplatePage: React.FC = () => {
    const [workTypes, setWorkTypes] = useState<WorkTypeEntity[]>([]);
    const [newWorkTypeTitle, setNewWorkTypeTitle] = useState('');
    const [selectedWorkTypeId, setSelectedWorkTypeId] = useState('');
    const [newStepName, setNewStepName] = useState('');
    const [newStepOrder, setNewStepOrder] = useState(1);
    const [newStepSkills, setNewStepSkills] = useState('');
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [selectedWorkEpicId, setSelectedWorkEpicId] = useState('');
    const [selectedWorkZoneId, setSelectedWorkZoneId] = useState('');
    const [selectedWorkFlowIds, setSelectedWorkFlowIds] = useState<string[]>([]);
    const [flowQuantities, setFlowQuantities] = useState<Record<string, number>>({});
    const [workloadCounts, setWorkloadCounts] = useState<Record<string, number>>({});
    const [showValidationError, setShowValidationError] = useState(false);
    const [allWorkZones, setAllWorkZones] = useState<WorkZoneEntity[]>([]);

    useEffect(() => {
        (async () => {
            setWorkTypes(await getAllWorkTypes(true) as WorkTypeEntity[]);
            setWorkEpics(await getAllWorkEpics(false) as WorkEpicEntity[]);
            setAllWorkZones(await getAllWorkZones() as WorkZoneEntity[]);
        })();
    }, []);

    async function handleAddWorkType() {
        const title = newWorkTypeTitle.trim();
        if (!title) return alert('請輸入標題！');
        const newWorkType: WorkTypeEntity = { typeId: shortId('wt-'), title, requiredSkills: [], flows: [] };
        await addWorkType(newWorkType);
        setWorkTypes(prev => [...prev, newWorkType]);
        setNewWorkTypeTitle('');
    }

    async function handleAddStep() {
        if (!selectedWorkTypeId || !newStepName.trim()) return;
        const workType = workTypes.find(t => t.typeId === selectedWorkTypeId);
        if (!workType) return;
        const steps = (workType.flows || []).flatMap(f => f.steps);
        if (steps.some(s => s.order === newStepOrder)) return alert('順序重複');
        const newFlow: WorkFlowEntity = {
            flowId: shortId('fl-'),
            workTypeId: selectedWorkTypeId,
            steps: [{
                stepName: newStepName,
                order: newStepOrder,
                requiredSkills: newStepSkills.split(',').map(s => s.trim()).filter(Boolean)
            }]
        };
        const updatedFlows = [...(workType.flows || []), newFlow];
        await updateWorkType(selectedWorkTypeId, { flows: updatedFlows });
        setWorkTypes(prev => prev.map(t => t.typeId === selectedWorkTypeId ? { ...t, flows: updatedFlows } : t));
        setNewStepName('');
        setNewStepSkills('');
        setNewStepOrder(newStepOrder + 1);
    }

    async function handleAddToWorkEpic() {
        if (!selectedWorkEpicId || !selectedWorkTypeId || selectedWorkFlowIds.length === 0) {
            setShowValidationError(true);
            return;
        }
        const epic = workEpics.find(e => e.epicId === selectedWorkEpicId);
        const type = workTypes.find(t => t.typeId === selectedWorkTypeId);
        if (!epic || !type || !type.flows) return;
        const flows = type.flows.filter(f => selectedWorkFlowIds.includes(f.flowId));
        if (!flows.length) return;
        const tasks: WorkTaskEntity[] = [];
        const loads: WorkLoadEntity[] = [];
        flows.forEach(flow => {
            const qty = flowQuantities[flow.flowId] || 1;
            const split = workloadCounts[flow.flowId] || 1;
            const stepName = flow.steps[0]?.stepName || '';
            const taskId = shortId('tk-');
            tasks.push({
                taskId,
                flowId: flow.flowId,
                targetQuantity: qty,
                unit: '單位',
                completedQuantity: 0,
                status: '待分配',
                title: `${epic.title}-${type.title}-${stepName}`
            });
            for (let j = 0; j < split; j++) {
                const loadId = shortId('ld-');
                loads.push({
                    loadId,
                    taskId,
                    plannedQuantity: Math.floor(qty / split),
                    unit: '單位',
                    plannedStartTime: '',
                    plannedEndTime: '',
                    actualQuantity: 0,
                    executor: [],
                    title: `${epic.title}-${type.title}-${stepName}-${j + 1}`,
                    epicIds: [epic.epicId]
                });
            }
        });
        const fixedLoads = loads.map(l => ({
            ...l,
            plannedStartTime: toISO(l.plannedStartTime),
            plannedEndTime: toISO(l.plannedEndTime)
        }));
        await updateWorkEpic(selectedWorkEpicId, {
            workTypes: [...(epic.workTypes || []), type],
            workFlows: [...(epic.workFlows || []), ...flows],
            workTasks: [...(epic.workTasks || []), ...tasks],
            workLoads: [...(epic.workLoads || []), ...fixedLoads]
        });
        setShowValidationError(false);
    }

    const epicOptions = workEpics.map(e => <option value={e.epicId} key={e.epicId}>{e.title}</option>);
    const typeOptions = workTypes.map(t => <option value={t.typeId} key={t.typeId}>{t.title}</option>);
    const selectedType = workTypes.find(t => t.typeId === selectedWorkTypeId);
    const filteredFlows = selectedType?.flows || [];
    const selectedEpic = workEpics.find(e => e.epicId === selectedWorkEpicId);
    const workZones = selectedEpic && selectedEpic.workZones && selectedEpic.workZones.length > 0
        ? selectedEpic.workZones
        : allWorkZones;

    // --- 全選功能的狀態與邏輯 ---
    const allSelected = filteredFlows.length > 0 && filteredFlows.every(f => selectedWorkFlowIds.includes(f.flowId));
    const someSelected = filteredFlows.some(f => selectedWorkFlowIds.includes(f.flowId));
    const selectAllRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someSelected && !allSelected;
        }
    }, [someSelected, allSelected, filteredFlows.length]);

    const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedWorkFlowIds(filteredFlows.map(f => f.flowId));
        } else {
            setSelectedWorkFlowIds([]);
        }
    };

    const handleFlowCheckboxChange = (flowId: string, checked: boolean) => {
        setSelectedWorkFlowIds(ids =>
            checked ? [...ids, flowId] : ids.filter(id => id !== flowId)
        );
    };

    return (
        <>
            <main className="p-4">
                <h1 className="text-xl font-bold mb-2">工作種類模板</h1>
                <div>
                    <input value={newWorkTypeTitle} onChange={e => setNewWorkTypeTitle(e.target.value)} placeholder="新種類標題" className="border p-1 mr-2" />
                    <button onClick={handleAddWorkType} className="bg-blue-500 text-white px-2 py-1">新增</button>
                </div>
                <ul>
                    {workTypes.map(t => <li key={t.typeId}>{t.title}</li>)}
                </ul>
                <h2 className="font-bold mt-6 mb-2">流程管理</h2>
                <div className="flex gap-2 mb-2">
                    <select
                        value={selectedWorkTypeId}
                        onChange={e => setSelectedWorkTypeId(e.target.value)}
                        className="border p-1"
                    >
                        <option value="">選擇種類</option>
                        {typeOptions}
                    </select>
                    <select
                        value={selectedWorkZoneId}
                        onChange={e => setSelectedWorkZoneId(e.target.value)}
                        className="border p-1"
                    >
                        <option value="">請選擇工作區</option>
                        {allWorkZones.map(zone => (
                            <option key={zone.zoneId} value={zone.zoneId}>{zone.title}</option>
                        ))}
                    </select>
                </div>
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
                                <div key={s.stepName}>{s.order}. {s.stepName} [{s.requiredSkills.join(',')}]</div>
                            ))}
                        </li>
                    )}
                </ul>
                <h2 className="font-bold mt-6 mb-2">加入工作標的</h2>
                <select value={selectedWorkEpicId} onChange={e => {
                    setSelectedWorkEpicId(e.target.value);
                    setSelectedWorkZoneId('');
                }} className="border p-1 mb-2">
                    <option value="">選擇標的</option>{epicOptions}
                </select>
                {workZones.length > 0 && (
                    <select value={selectedWorkZoneId} onChange={e => setSelectedWorkZoneId(e.target.value)} className="border p-1 mb-2">
                        <option value="">請選擇工作區</option>
                        {workZones.map(z => (
                            <option key={z.zoneId} value={z.zoneId}>{z.title}</option>
                        ))}
                    </select>
                )}
                <select value={selectedWorkTypeId} onChange={e => { setSelectedWorkTypeId(e.target.value); setSelectedWorkFlowIds([]); }} className="border p-1 mb-2">
                    <option value="">選擇種類</option>{typeOptions}
                </select>
                {filteredFlows.length > 0 && (
                    <div className="mb-2">
                        <label className="mr-2">
                            <input
                                ref={selectAllRef}
                                type="checkbox"
                                checked={allSelected}
                                onChange={handleSelectAllChange}
                            /> 全選
                        </label>
                    </div>
                )}
                <div>
                    {filteredFlows.map(f => (
                        <div key={f.flowId}>
                            <input
                                type="checkbox"
                                checked={selectedWorkFlowIds.includes(f.flowId)}
                                onChange={e => handleFlowCheckboxChange(f.flowId, e.target.checked)}
                            />
                            <span>{f.steps[0]?.stepName || ''}</span>
                            <input
                                type="number"
                                value={flowQuantities[f.flowId] ?? ''}
                                min={1}
                                onChange={e => setFlowQuantities(q => ({ ...q, [f.flowId]: Number(e.target.value) }))}
                                placeholder="數量"
                                className="border w-16 mx-1"
                            />
                            <input
                                type="number"
                                value={workloadCounts[f.flowId] ?? 1}
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
                {/* 已從底部移除單獨的選擇工作區 */}
            </main>
            <ManagementBottomNav />
        </>
    );
};

export default WorkTemplatePage;