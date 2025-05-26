"use client";
import {
    getAllWorkEpics,
    updateWorkEpic,
    type WorkEpicEntity
} from "@/app/actions/workepic.action";
import type { WorkFlowEntity } from "@/app/actions/workflow.action";
import { WorkLoadEntity } from "@/app/actions/workload.action";
import { WorkTaskEntity } from "@/app/actions/worktask.action";
import {
    addWorkType,
    getAllWorkTypes,
    updateWorkType,
    type WorkTypeEntity
} from "@/app/actions/worktype.action";
import type { WorkZoneEntity } from "@/app/actions/workzone.action";
import { getAllWorkZones } from "@/app/actions/workzone.action";
import { AdminBottomNav } from "@/modules/shared/interfaces/navigation/admin-bottom-nav";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

// Externalized user-facing strings
const STRINGS = {
    title: "模板",
    addTypePlaceholder: "新種類標題",
    add: "新增",
    workflowTitle: "流程",
    selectType: "選擇種類",
    stepName: "步驟名稱",
    order: "順序",
    skills: "技能(逗號)",
    addStep: "新增步驟",
    addToEpicTitle: "標的",
    selectEpic: "選擇標的",
    selectZone: "選擇工作區",
    region: ["北部", "中部", "南部", "東部", "離島"],
    useDefaultZone: "使用預設工作區",
    selectAll: "全選",
    quantity: "數量",
    split: "分割",
    validationError: "請確保所有項目都已選擇！",
    addToEpic: "加入標的",
    addToEpicSuccess: "成功加入標的"
};

/** 產生短ID */
const shortId = (prefix = "") =>
    `${prefix}${Math.random().toString(36).slice(2, 8)}`;

/** 轉為 ISO 日期字串 */
const toIso = (date: string | number | Date | undefined | null): string => {
    if (!date) return "";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "" : d.toISOString();
};

const selectBase =
    "bg-background text-foreground border border-gray-300 dark:border-neutral-700 outline-none rounded min-w-[180px] max-w-full w-full px-3 py-2 " +
    "transition-colors duration-150 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
    "dark:bg-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500";

const tabBase =
    "px-4 py-2 font-medium text-sm rounded-t border-b-2 transition-all duration-150 focus:outline-none";
const tabActive =
    "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900";
const tabInactive =
    "border-transparent text-gray-500 dark:text-neutral-400 hover:text-blue-500 hover:border-blue-300 bg-gray-100 dark:bg-neutral-800";

/**
 * 最簡易的成功提示 Modal
 */
const SimpleModal: React.FC<{ open: boolean; onClose: () => void; message: string }> = ({ open, onClose, message }) => {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-neutral-900 rounded shadow-lg p-6 min-w-[200px] text-center"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-green-600 dark:text-green-400 mb-4">{message}</div>
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={onClose}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

const WorkTemplatePage: React.FC = () => {
    const [workTypes, setWorkTypes] = useState<WorkTypeEntity[]>([]);
    const [newWorkTypeTitle, setNewWorkTypeTitle] = useState("");
    const [selectedWorkTypeId, setSelectedWorkTypeId] = useState("");
    const [newStepName, setNewStepName] = useState("");
    const [newStepOrder, setNewStepOrder] = useState(1);
    const [newStepSkills, setNewStepSkills] = useState("");
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [selectedWorkEpicId, setSelectedWorkEpicId] = useState("");
    const [selectedWorkZoneId, setSelectedWorkZoneId] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<
        "北部" | "中部" | "南部" | "東部" | "離島"
    >("北部");
    const [selectedWorkFlowIds, setSelectedWorkFlowIds] = useState<string[]>([]);
    const [flowQuantities, setFlowQuantities] = useState<Record<string, number>>({});
    const [workloadCounts, setWorkloadCounts] = useState<Record<string, number>>({});
    const [showValidationError, setShowValidationError] = useState(false);
    const [allWorkZones, setAllWorkZones] = useState<WorkZoneEntity[]>([]);
    const [tab, setTab] = useState<"template" | "epic">("epic");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        (async () => {
            setWorkTypes((await getAllWorkTypes(true)) as WorkTypeEntity[]);
            setWorkEpics((await getAllWorkEpics(false)) as WorkEpicEntity[]);
            setAllWorkZones((await getAllWorkZones()) as WorkZoneEntity[]);
        })();
    }, []);

    const handleAddWorkType = async () => {
        const title = newWorkTypeTitle.trim();
        if (!title) return alert("請輸入標題！");
        const newWorkType: WorkTypeEntity = { typeId: shortId("wt-"), title, requiredSkills: [], flows: [] };
        await addWorkType(newWorkType);
        setWorkTypes(prev => [...prev, newWorkType]);
        setNewWorkTypeTitle("");
    };

    const handleAddStep = async () => {
        if (!selectedWorkTypeId || !newStepName.trim()) return;
        const workType = workTypes.find(t => t.typeId === selectedWorkTypeId);
        if (!workType) return;
        const steps = (workType.flows || []).flatMap(f => f.steps);
        if (steps.some(s => s.order === newStepOrder)) return alert("順序重複");
        const newFlow: WorkFlowEntity = {
            flowId: shortId("fl-"),
            workTypeId: selectedWorkTypeId,
            steps: [{
                stepName: newStepName,
                order: newStepOrder,
                requiredSkills: newStepSkills.split(",").map(s => s.trim()).filter(Boolean)
            }]
        };
        const updatedFlows = [...(workType.flows || []), newFlow];
        await updateWorkType(selectedWorkTypeId, { flows: updatedFlows });
        setWorkTypes(prev => prev.map(t => t.typeId === selectedWorkTypeId ? { ...t, flows: updatedFlows } : t));
        setNewStepName("");
        setNewStepSkills("");
        setNewStepOrder(newStepOrder + 1);
    };

    const handleAddToWorkEpic = async () => {
        if (!selectedWorkEpicId || !selectedWorkTypeId || selectedWorkFlowIds.length === 0) {
            setShowValidationError(true);
            return;
        }
        const epic = workEpics.find(e => e.epicId === selectedWorkEpicId);
        const type = workTypes.find(t => t.typeId === selectedWorkTypeId);
        if (!epic || !type || !type.flows) return;

        let workZoneId = selectedWorkZoneId;
        if (!workZoneId) {
            const defaultZone: WorkZoneEntity = {
                zoneId: shortId("wz-"),
                title: "default",
                description: "標的內預設區域",
                address: "",
                createdAt: new Date().toISOString(),
                status: "啟用",
                region: selectedRegion
            };
            workZoneId = defaultZone.zoneId;
            if (!epic.workZones) {
                epic.workZones = [defaultZone];
            } else if (!epic.workZones.some(z => z.title === "default")) {
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
            const stepName = flow.steps[0]?.stepName || "";
            const taskId = shortId("tk-");
            tasks.push({
                taskId,
                flowId: flow.flowId,
                targetQuantity: qty,
                unit: "單位",
                completedQuantity: 0,
                status: "待分配",
                title: `${epic.title}-${stepName}`
            });
            for (let j = 0; j < split; j++) {
                const loadId = shortId("ld-");
                loads.push({
                    loadId,
                    taskId,
                    plannedQuantity: Math.floor(qty / split),
                    unit: "單位",
                    plannedStartTime: "",
                    plannedEndTime: "",
                    actualQuantity: 0,
                    executor: [],
                    title: `${epic.title}-${stepName}`,
                    epicIds: [epic.epicId]
                });
            }
        });
        const fixedLoads = loads.map(l => ({
            ...l,
            plannedStartTime: toIso(l.plannedStartTime),
            plannedEndTime: toIso(l.plannedEndTime)
        }));
        await updateWorkEpic(selectedWorkEpicId, {
            workTypes: [...(epic.workTypes || []), type],
            workFlows: [...(epic.workFlows || []), ...flows],
            workTasks: [...(epic.workTasks || []), ...tasks],
            workLoads: [...(epic.workLoads || []), ...fixedLoads]
        });
        setShowValidationError(false);
        setShowSuccessModal(true);
    };

    const epicOptions = workEpics.map(e =>
        <option value={e.epicId} key={e.epicId}>{e.title}</option>
    );
    const typeOptions = workTypes.map(t =>
        <option value={t.typeId} key={t.typeId}>{t.title}</option>
    );
    const selectedType = workTypes.find(t => t.typeId === selectedWorkTypeId);
    const filteredFlows = selectedType?.flows || [];
    const selectedEpic = workEpics.find(e => e.epicId === selectedWorkEpicId);
    const workZones = selectedEpic && selectedEpic.workZones && selectedEpic.workZones.length > 0
        ? selectedEpic.workZones
        : allWorkZones;

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
                <h1 className="text-xl font-bold mb-4">{STRINGS.title}</h1>
                {/* Tabs */}
                <div className="flex border-b border-gray-300 dark:border-neutral-700 mb-4 space-x-2">
                    <button
                        type="button"
                        className={`${tabBase} ${tab === "epic" ? tabActive : tabInactive}`}
                        onClick={() => setTab("epic")}
                        tabIndex={0}
                    >
                        {STRINGS.addToEpicTitle}
                    </button>
                    <button
                        type="button"
                        className={`${tabBase} ${tab === "template" ? tabActive : tabInactive}`}
                        onClick={() => setTab("template")}
                        tabIndex={0}
                    >
                        {STRINGS.title}
                    </button>
                </div>
                {/* Tab panels */}
                {tab === "epic" && (
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 mb-6">
                        <h2 className="font-bold mb-2">{STRINGS.addToEpicTitle}</h2>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {/* Epic 下拉選單 */}
                            <div className="flex-1 min-w-[180px] max-w-xs">
                                <select
                                    value={selectedWorkEpicId}
                                    onChange={e => {
                                        setSelectedWorkEpicId(e.target.value);
                                        setSelectedWorkZoneId("");
                                    }}
                                    className={selectBase}
                                    aria-label={STRINGS.selectEpic}
                                >
                                    <option value="">{STRINGS.selectEpic}</option>
                                    {epicOptions}
                                </select>
                            </div>
                            {/* 區域 下拉選單 */}
                            <div className="flex-1 min-w-[120px] max-w-xs">
                                <select
                                    value={selectedRegion}
                                    onChange={e => setSelectedRegion(e.target.value as typeof selectedRegion)}
                                    className={selectBase}
                                    aria-label="region"
                                >
                                    {STRINGS.region.map(region => (
                                        <option key={region} value={region}>{region}</option>
                                    ))}
                                </select>
                            </div>
                            {/* 工作區 下拉選單 */}
                            <div className="flex-1 min-w-[180px] max-w-xs relative">
                                <select
                                    value={selectedWorkZoneId}
                                    onChange={e => setSelectedWorkZoneId(e.target.value)}
                                    className={selectBase + " pr-10"}
                                    aria-label={STRINGS.selectZone}
                                >
                                    <option value="">{STRINGS.useDefaultZone}</option>
                                    {workZones.map(z => (
                                        <option key={z.zoneId} value={z.zoneId}>
                                            {z.title || "（未命名工作區）"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* 種類 下拉選單 */}
                            <div className="flex-1 min-w-[120px] max-w-xs">
                                <select
                                    value={selectedWorkTypeId}
                                    onChange={e => { setSelectedWorkTypeId(e.target.value); setSelectedWorkFlowIds([]); }}
                                    className={selectBase}
                                    aria-label={STRINGS.selectType}
                                >
                                    <option value="">{STRINGS.selectType}</option>
                                    {typeOptions}
                                </select>
                            </div>
                        </div>
                        {filteredFlows.length > 0 && (
                            <div className="mb-2">
                                <label className="mr-2">
                                    <input
                                        ref={selectAllRef}
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAllChange}
                                    /> {STRINGS.selectAll}
                                </label>
                            </div>
                        )}
                        {/* 單排顯示 flows -> 改為一行一個 */}
                        <div className="flex flex-col gap-2">
                            {filteredFlows.map(f => (
                                <div key={f.flowId} className="bg-gray-50 dark:bg-neutral-700 rounded shadow px-3 py-2 flex items-center gap-2 mb-2 min-w-[220px]">
                                    <input
                                        type="checkbox"
                                        checked={selectedWorkFlowIds.includes(f.flowId)}
                                        onChange={e => handleFlowCheckboxChange(f.flowId, e.target.checked)}
                                    />
                                    <span className="flex-1">{f.steps[0]?.stepName || ""}</span>
                                    <input
                                        type="number"
                                        value={flowQuantities[f.flowId] ?? ""}
                                        min={1}
                                        onChange={e => setFlowQuantities(q => ({ ...q, [f.flowId]: Number(e.target.value) }))}
                                        placeholder={STRINGS.quantity}
                                        className="border w-16 mx-1 p-1 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                    />
                                    <input
                                        type="number"
                                        value={workloadCounts[f.flowId] ?? 1}
                                        min={1}
                                        onChange={e => setWorkloadCounts(c => ({ ...c, [f.flowId]: Number(e.target.value) || 1 }))}
                                        placeholder={STRINGS.split}
                                        className="border w-12 p-1 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                    />
                                </div>
                            ))}
                        </div>
                        {showValidationError &&
                            <div className="text-red-500 mt-2">{STRINGS.validationError}</div>
                        }
                        <button
                            onClick={handleAddToWorkEpic}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-4"
                        >
                            {STRINGS.addToEpic}
                        </button>
                    </div>
                )}
                {tab === "template" && (
                    <>
                        {/* 種類卡片 */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 mb-6">
                            <div className="flex items-center mb-2">
                                <input
                                    value={newWorkTypeTitle}
                                    onChange={e => setNewWorkTypeTitle(e.target.value)}
                                    placeholder={STRINGS.addTypePlaceholder}
                                    className="border p-2 rounded mr-2 flex-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                />
                                <button
                                    onClick={handleAddWorkType}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                >
                                    {STRINGS.add}
                                </button>
                            </div>
                            <ul className="flex flex-wrap gap-2">
                                {workTypes.map(t =>
                                    <li key={t.typeId} className="bg-gray-50 dark:bg-neutral-700 rounded px-3 py-1 shadow text-gray-700 dark:text-neutral-100">{t.title}</li>
                                )}
                            </ul>
                        </div>
                        {/* 流程管理 */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 mb-6">
                            <h2 className="font-bold mb-2">{STRINGS.workflowTitle}</h2>
                            <div className="flex gap-2 mb-2">
                                <select
                                    value={selectedWorkTypeId}
                                    onChange={e => setSelectedWorkTypeId(e.target.value)}
                                    className={selectBase}
                                >
                                    <option value="">{STRINGS.selectType}</option>
                                    {typeOptions}
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                <input
                                    value={newStepName}
                                    onChange={e => setNewStepName(e.target.value)}
                                    placeholder={STRINGS.stepName}
                                    className="border p-2 rounded mr-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                />
                                <input
                                    type="number"
                                    value={newStepOrder}
                                    min={1}
                                    onChange={e => setNewStepOrder(Number(e.target.value))}
                                    className="border w-20 p-2 rounded mr-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                />
                                <input
                                    value={newStepSkills}
                                    onChange={e => setNewStepSkills(e.target.value)}
                                    placeholder={STRINGS.skills}
                                    className="border p-2 rounded mr-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                />
                                <button
                                    onClick={handleAddStep}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                >
                                    {STRINGS.addStep}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {filteredFlows.map(f =>
                                    <div key={f.flowId} className="bg-gray-50 dark:bg-neutral-700 rounded shadow px-3 py-2 mb-1 min-w-[180px]">
                                        {f.steps.map(s => (
                                            <div key={s.stepName} className="text-gray-700 dark:text-neutral-100">
                                                <span className="font-semibold">{s.order}. {s.stepName}</span>
                                                <span className="ml-2 text-xs text-gray-500 dark:text-neutral-400">[{s.requiredSkills.join(",")}]</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
            <SimpleModal
                open={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                message={STRINGS.addToEpicSuccess}
            />
            <AdminBottomNav />
        </>
    );
};

export default WorkTemplatePage;