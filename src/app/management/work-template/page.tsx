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
    const [selectedRegion, setSelectedRegion] = useState<'北部' | '中部' | '南部' | '東部' | '離島'>('北部');
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

        // 如果沒有選擇工作區，建立預設工作區
        let workZoneId = selectedWorkZoneId;
        if (!workZoneId) {
            const defaultZone: WorkZoneEntity = {
                zoneId: shortId('wz-'),
                title: 'default',
                description: '標的內預設區域',
                address: '',
                createdAt: new Date().toISOString(),
                status: '啟用',
                region: selectedRegion
            };
            workZoneId = defaultZone.zoneId;
            if (!epic.workZones) {
                epic.workZones = [defaultZone];
            } else if (!epic.workZones.some(z => z.title === 'default')) {
                epic.workZones.push(defaultZone);
            }
        }

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
                title: `${epic.title}-${stepName}` // <--- 已修改
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
                    title: `${epic.title}-${stepName}`, // <--- 已修改
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
            <main className="p-4 bg-gray-100 dark:bg-neutral-900 min-h-screen text-foreground dark:text-neutral-100">
                <h1 className="text-xl font-bold mb-4">工作種類模板</h1>
                {/* 種類卡片 */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 mb-6 transition-colors">
                    <div className="flex items-center mb-2">
                        <input
                            value={newWorkTypeTitle}
                            onChange={e => setNewWorkTypeTitle(e.target.value)}
                            placeholder="新種類標題"
                            className="border p-2 rounded mr-2 flex-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                        />
                        <button
                            onClick={handleAddWorkType}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                        >
                            新增
                        </button>
                    </div>
                    <ul className="flex flex-wrap gap-2">
                        {workTypes.map(t =>
                            <li key={t.typeId} className="bg-gray-50 dark:bg-neutral-700 rounded px-3 py-1 shadow text-gray-700 dark:text-neutral-100 transition-colors">{t.title}</li>
                        )}
                    </ul>
                </div>
                {/* 流程管理卡片 */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 mb-6 transition-colors">
                    <h2 className="font-bold mb-2">流程管理</h2>
                    <div className="flex gap-2 mb-2">
                        <select
                            value={selectedWorkTypeId}
                            onChange={e => setSelectedWorkTypeId(e.target.value)}
                            className="border p-2 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                        >
                            <option value="">選擇種類</option>
                            {typeOptions}
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <input
                            value={newStepName}
                            onChange={e => setNewStepName(e.target.value)}
                            placeholder="步驟名稱"
                            className="border p-2 rounded mr-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                        />
                        <input
                            type="number"
                            value={newStepOrder}
                            min={1}
                            onChange={e => setNewStepOrder(Number(e.target.value))}
                            className="border w-20 p-2 rounded mr-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                        />
                        <input
                            value={newStepSkills}
                            onChange={e => setNewStepSkills(e.target.value)}
                            placeholder="技能(逗號)"
                            className="border p-2 rounded mr-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                        />
                        <button
                            onClick={handleAddStep}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                        >
                            新增步驟
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filteredFlows.map(f =>
                            <div key={f.flowId} className="bg-gray-50 dark:bg-neutral-700 rounded shadow px-3 py-2 mb-1 min-w-[180px] transition-colors">
                                {f.steps.map(s => (
                                    <div key={s.stepName} className="text-gray-700 dark:text-neutral-100">
                                        <span className="font-semibold">{s.order}. {s.stepName}</span>
                                        <span className="ml-2 text-xs text-gray-500 dark:text-neutral-400">[{s.requiredSkills.join(',')}]</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/* 加入標的卡片 */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 mb-6 transition-colors">
                    <h2 className="font-bold mb-2">加入工作標的</h2>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <select
                            value={selectedWorkEpicId}
                            onChange={e => {
                                setSelectedWorkEpicId(e.target.value);
                                setSelectedWorkZoneId('');
                            }}
                            className="border p-2 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                        >
                            <option value="">選擇標的</option>{epicOptions}
                        </select>
                        <select
                            value={selectedRegion}
                            onChange={e => setSelectedRegion(e.target.value as '北部' | '中部' | '南部' | '東部' | '離島')}
                            className="border p-2 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                        >
                            {['北部', '中部', '南部', '東部', '離島'].map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                        {workZones.length > 0 && (
                            <select
                                value={selectedWorkZoneId}
                                onChange={e => setSelectedWorkZoneId(e.target.value)}
                                className="border p-2 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                            >
                                <option value="">使用預設工作區</option>
                                {workZones.map(z => (
                                    <option key={z.zoneId} value={z.zoneId}>{z.title}</option>
                                ))}
                            </select>
                        )}
                        <select
                            value={selectedWorkTypeId}
                            onChange={e => { setSelectedWorkTypeId(e.target.value); setSelectedWorkFlowIds([]); }}
                            className="border p-2 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                        >
                            <option value="">選擇種類</option>{typeOptions}
                        </select>
                    </div>
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
                    <div className="flex flex-wrap gap-2">
                        {filteredFlows.map(f => (
                            <div key={f.flowId} className="bg-gray-50 dark:bg-neutral-700 rounded shadow px-3 py-2 flex items-center gap-2 mb-2 min-w-[220px] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedWorkFlowIds.includes(f.flowId)}
                                    onChange={e => handleFlowCheckboxChange(f.flowId, e.target.checked)}
                                />
                                <span className="flex-1">{f.steps[0]?.stepName || ''}</span>
                                <input
                                    type="number"
                                    value={flowQuantities[f.flowId] ?? ''}
                                    min={1}
                                    onChange={e => setFlowQuantities(q => ({ ...q, [f.flowId]: Number(e.target.value) }))}
                                    placeholder="數量"
                                    className="border w-16 mx-1 p-1 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                                />
                                <input
                                    type="number"
                                    value={workloadCounts[f.flowId] ?? 1}
                                    min={1}
                                    onChange={e => setWorkloadCounts(c => ({ ...c, [f.flowId]: Number(e.target.value) || 1 }))}
                                    placeholder="分割"
                                    className="border w-12 p-1 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                    {showValidationError && <div className="text-red-500 mt-2">請確保所有項目都已選擇！</div>}
                    <button
                        onClick={handleAddToWorkEpic}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-4 transition"
                    >
                        加入標的
                    </button>
                </div>
                {/* 已從底部移除單獨的選擇工作區 */}
            </main>
            <ManagementBottomNav />
        </>
    );
};

export default WorkTemplatePage;