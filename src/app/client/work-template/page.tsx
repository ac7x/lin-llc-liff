"use client";

import { addWorkFlow, getAllWorkFlows, WorkFlow } from "@/app/actions/workflow.action";
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

    // ✅ 根據所選工作種類過濾流程
    const filteredFlows = selectedWorkTypeId
        ? workFlows.filter(flow => flow.workTypeId === selectedWorkTypeId)
        : [];

    // ✅ 取得該工作種類所有步驟
    const allSteps = filteredFlows.flatMap(flow => flow.steps);

    // ✅ 計算目前最大順序
    const maxOrder = allSteps.length > 0 ? Math.max(...allSteps.map(step => step.order)) : 0;

    // ✅ 自動更新可用順序
    useEffect(() => {
        if (selectedWorkTypeId) {
            setNewStepOrder(maxOrder + 1);
        }
    }, [selectedWorkTypeId, workFlows]);

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

        // ✅ 驗證是否有遺漏的前一個步驟
        const existingOrders = allSteps.map(step => step.order);
        for (let i = 1; i < newStepOrder; i++) {
            if (!existingOrders.includes(i)) {
                alert(`請先建立第 ${i} 步`);
                return;
            }
        }

        // ✅ 驗證是否已存在相同順序
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
        setNewStepOrder(prev => prev + 1); // 自動前進到下一步
    };

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
            </main>
            <GlobalBottomNav />
        </>
    );
};

export default WorkTemplatePage;
