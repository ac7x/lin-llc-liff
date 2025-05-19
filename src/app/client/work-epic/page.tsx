"use client";

import { addWorkEpic, deleteWorkEpic, getAllWorkEpics, updateWorkEpic, WorkEpicEntity } from "@/app/actions/workepic.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { useEffect, useState } from "react";

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [newEpicTitle, setNewEpicTitle] = useState("");
    const [editingEpicId, setEditingEpicId] = useState<string | null>(null);
    const [editFields, setEditFields] = useState<Partial<WorkEpicEntity>>({});

    useEffect(() => {
        const fetchWorkEpics = async () => {
            const epics = await getAllWorkEpics(false); // 使用 false 表示實體階段
            setWorkEpics(epics as WorkEpicEntity[]);
        };
        fetchWorkEpics();
    }, []);

    const handleAddEpic = async () => {
        if (!newEpicTitle.trim()) {
            alert("請輸入標的標題！");
            return;
        }

        const newEpic: WorkEpicEntity = {
            epicId: `epic-${Date.now()}`,
            title: newEpicTitle,
            startDate: "",
            endDate: "",
            insuranceStatus: "無",
            owner: "未指定",
            status: "待開始",
            priority: 1,
            region: "北部", // 預設區域
            address: "未指定", // 預設地址
            createdAt: new Date().toISOString() // 新增 createdAt 屬性
        };

        await addWorkEpic(newEpic);
        setWorkEpics(prev => [...prev, newEpic]);
        setNewEpicTitle("");
    };

    const handleEditClick = (epic: WorkEpicEntity) => {
        setEditingEpicId(epic.epicId);
        setEditFields({ ...epic });
    };

    const handleEditFieldChange = (field: keyof WorkEpicEntity, value: string | number | undefined) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveEdit = async (epicId: string) => {
        await updateWorkEpic(epicId, editFields);
        setWorkEpics(prev => prev.map(epic => epic.epicId === epicId ? { ...epic, ...editFields } : epic));
        setEditingEpicId(null);
    };

    const handleCancelEdit = () => {
        setEditingEpicId(null);
        setEditFields({});
    };

    const handleDeleteEpic = async (epicId: string) => {
        if (window.confirm('確定要刪除這個標的嗎？')) {
            await deleteWorkEpic(epicId);
            setWorkEpics(prev => prev.filter(epic => epic.epicId !== epicId));
        }
    };

    // 計算進度
    const getEpicProgress = (epic: WorkEpicEntity) => {
        let total = 0
        let completed = 0

        // 只統計每個 workTask 一次，避免重複加總
        if (epic.workTasks) {
            epic.workTasks.forEach(task => {
                total += task.targetQuantity
                completed += task.completedQuantity
            })
        }

        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
        return { percent, completed, total }
    }

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作標的列表</h1>

                {/* 進度表區塊 */}
                <div className="mb-6">
                    {workEpics.map(epic => {
                        const progress = getEpicProgress(epic)
                        return (
                            <div key={epic.epicId} className="mb-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold">{epic.title}</span>
                                    <span className="text-sm text-gray-600">{progress.completed}/{progress.total}（{progress.percent}%）</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded h-3">
                                    <div
                                        className="bg-green-500 h-3 rounded"
                                        style={{ width: `${progress.percent}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* 新增標的區域 */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={newEpicTitle}
                        onChange={e => setNewEpicTitle(e.target.value)}
                        placeholder="輸入新標的標題"
                        className="border p-2 mr-2"
                    />
                    <button
                        onClick={handleAddEpic}
                        className="bg-blue-500 text-white px-4 py-2"
                    >
                        建立標的
                    </button>
                </div>

                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 px-4 py-2">標題</th>
                            <th className="border border-gray-300 px-4 py-2">開始時間</th>
                            <th className="border border-gray-300 px-4 py-2">結束時間</th>
                            <th className="border border-gray-300 px-4 py-2">保險狀態</th>
                            <th className="border border-gray-300 px-4 py-2">負責人</th>
                            <th className="border border-gray-300 px-4 py-2">狀態</th>
                            <th className="border border-gray-300 px-4 py-2">優先級</th>
                            <th className="border border-gray-300 px-4 py-2">地點</th>
                            <th className="border border-gray-300 px-4 py-2">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workEpics.map(epic => (
                            <tr key={epic.epicId}>
                                {editingEpicId === epic.epicId ? (
                                    <>
                                        <td className="border px-2 py-1"><input value={editFields.title || ''} onChange={e => handleEditFieldChange('title', e.target.value)} className="border p-1 w-full" /></td>
                                        <td className="border px-2 py-1"><input type="date" value={editFields.startDate || ''} onChange={e => handleEditFieldChange('startDate', e.target.value)} className="border p-1 w-full" /></td>
                                        <td className="border px-2 py-1"><input type="date" value={editFields.endDate || ''} onChange={e => handleEditFieldChange('endDate', e.target.value)} className="border p-1 w-full" /></td>
                                        <td className="border px-2 py-1">
                                            <select value={editFields.insuranceStatus || '無'} onChange={e => handleEditFieldChange('insuranceStatus', e.target.value)} className="border p-1 w-full">
                                                <option value="無">無</option>
                                                <option value="有">有</option>
                                            </select>
                                        </td>
                                        <td className="border px-2 py-1"><input value={editFields.owner || ''} onChange={e => handleEditFieldChange('owner', e.target.value)} className="border p-1 w-full" /></td>
                                        <td className="border px-2 py-1">
                                            <select value={editFields.status || '待開始'} onChange={e => handleEditFieldChange('status', e.target.value)} className="border p-1 w-full">
                                                <option value="待開始">待開始</option>
                                                <option value="進行中">進行中</option>
                                                <option value="已完成">已完成</option>
                                                <option value="已取消">已取消</option>
                                            </select>
                                        </td>
                                        <td className="border px-2 py-1"><input type="number" value={editFields.priority || 1} onChange={e => handleEditFieldChange('priority', Number(e.target.value))} className="border p-1 w-full" /></td>
                                        <td className="border px-2 py-1">
                                            <select value={editFields.region || '北部'} onChange={e => handleEditFieldChange('region', e.target.value)} className="border p-1 w-full">
                                                <option value="北部">北部</option>
                                                <option value="中部">中部</option>
                                                <option value="南部">南部</option>
                                                <option value="東部">東部</option>
                                                <option value="離島">離島</option>
                                            </select>
                                        </td>
                                        <td className="border px-2 py-1 flex gap-2">
                                            <button onClick={() => handleSaveEdit(epic.epicId)} className="bg-green-500 text-white px-2 py-1 rounded">儲存</button>
                                            <button onClick={handleCancelEdit} className="bg-gray-300 px-2 py-1 rounded">取消</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="border px-2 py-1">{epic.title}</td>
                                        <td className="border px-2 py-1">{epic.startDate}</td>
                                        <td className="border px-2 py-1">{epic.endDate}</td>
                                        <td className="border px-2 py-1">{epic.insuranceStatus || '無'}</td>
                                        <td className="border px-2 py-1">{epic.owner}</td>
                                        <td className="border px-2 py-1">{epic.status}</td>
                                        <td className="border px-2 py-1">{epic.priority}</td>
                                        <td className="border px-2 py-1">{epic.region}</td>
                                        <td className="border px-2 py-1 flex gap-2">
                                            <button onClick={() => handleEditClick(epic)} className="bg-yellow-400 text-white px-2 py-1 rounded">編輯</button>
                                            <button onClick={() => handleDeleteEpic(epic.epicId)} className="bg-red-500 text-white px-2 py-1 rounded">刪除</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <GlobalBottomNav />
        </>
    );
}