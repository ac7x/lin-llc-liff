"use client";

import { addWorkEpic, deleteWorkEpic, getAllWorkEpics, updateWorkEpic, WorkEpicEntity } from "@/app/actions/workepic.action";
import { getAllWorkMembers, WorkMember } from "@/app/actions/workmember.action";
import { getAllWorkTasks, WorkTaskEntity } from "@/app/actions/worktask.action";
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import { useEffect, useState } from "react";

// 進度條元件
const ProgressBar = ({ completed, total, percent }: { completed: number, total: number, percent: number }) => (
    <div>
        <div className="w-full bg-gray-200 rounded h-3">
            <div className="bg-green-500 h-3 rounded" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-xs text-right">{completed}/{total}（{percent}%）</div>
    </div>
);

interface MemberOption {
    memberId: string;
    name: string;
}

interface SingleSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: MemberOption[];
    placeholder: string;
}
const SingleSelect = ({ value, onChange, options, placeholder }: SingleSelectProps) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="border p-2 mr-2">
        <option value="">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.memberId} value={opt.memberId}>{opt.name}</option>
        ))}
    </select>
);

interface MultiSelectProps {
    value: string[];
    onChange: (selected: string[]) => void;
    options: MemberOption[];
    placeholder: string;
}
const MultiSelect = ({ value, onChange, options, placeholder }: MultiSelectProps) => (
    <select
        multiple
        value={value}
        onChange={e => {
            const selected = Array.from(e.target.selectedOptions).map((opt: HTMLOptionElement) => opt.value);
            onChange(selected);
        }}
        className="border p-2 mr-2 min-w-[120px] max-w-[220px] h-[90px]"
        style={{ verticalAlign: 'top' }}
    >
        <option disabled value="">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.memberId} value={opt.memberId}>{opt.name}</option>
        ))}
    </select>
);

type MemberWithIdName = { memberId: string; name: string };

// 編輯列
interface EpicEditRowProps {
    editFields: Partial<WorkEpicEntity>;
    members: WorkMember[];
    onFieldChange: (
        field: keyof WorkEpicEntity,
        value: string | number | boolean | MemberWithIdName | MemberWithIdName[] | undefined
    ) => void;
    onSave: () => void;
    onCancel: () => void;
    progress: { completed: number; total: number; percent: number };
}
const EpicEditRow = ({
    editFields, members, onFieldChange, onSave, onCancel, progress
}: EpicEditRowProps & { progress: { completed: number; total: number; percent: number } }) => (
    <>
        <td className="border px-2 py-1 w-52"><ProgressBar {...progress} /></td>
        <td className="border px-2 py-1"><input value={editFields.title || ''} onChange={e => onFieldChange('title', e.target.value)} className="border p-1 w-full" /></td>
        <td className="border px-2 py-1"><input type="date" value={editFields.startDate || ''} onChange={e => onFieldChange('startDate', e.target.value)} className="border p-1 w-full" /></td>
        <td className="border px-2 py-1"><input type="date" value={editFields.endDate || ''} onChange={e => onFieldChange('endDate', e.target.value)} className="border p-1 w-full" /></td>
        <td className="border px-2 py-1">
            <select value={editFields.insuranceStatus || '無'} onChange={e => onFieldChange('insuranceStatus', e.target.value)} className="border p-1 w-full">
                <option value="無">無</option>
                <option value="有">有</option>
            </select>
        </td>
        <td className="border px-2 py-1">
            <SingleSelect
                value={editFields.owner?.memberId || ''}
                onChange={val => {
                    const member = members.find((m: WorkMember) => m.memberId === val);
                    onFieldChange('owner', member ? { memberId: member.memberId, name: member.name } : undefined);
                }}
                options={members}
                placeholder="請選擇"
            />
        </td>
        <td className="border px-2 py-1">
            <MultiSelect
                value={Array.isArray(editFields.siteSupervisors) ? editFields.siteSupervisors.map((s: MemberWithIdName) => s.memberId) : []}
                onChange={selected => onFieldChange(
                    'siteSupervisors',
                    members.filter((m: WorkMember) => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name }))
                )}
                options={members}
                placeholder="選擇現場監督"
            />
            <div className="text-xs mt-1 text-gray-700 break-words">
                {Array.isArray(editFields.siteSupervisors) && editFields.siteSupervisors.length > 0
                    ? (editFields.siteSupervisors as MemberWithIdName[]).map(s => s.name).join('、')
                    : <span className="text-gray-400">尚未選擇</span>
                }
            </div>
        </td>
        <td className="border px-2 py-1">
            <MultiSelect
                value={Array.isArray(editFields.safetyOfficers) ? editFields.safetyOfficers.map((s: MemberWithIdName) => s.memberId) : []}
                onChange={selected => onFieldChange(
                    'safetyOfficers',
                    members.filter((m: WorkMember) => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name }))
                )}
                options={members}
                placeholder="選擇安全員"
            />
            <div className="text-xs mt-1 text-gray-700 break-words">
                {Array.isArray(editFields.safetyOfficers) && editFields.safetyOfficers.length > 0
                    ? (editFields.safetyOfficers as MemberWithIdName[]).map(s => s.name).join('、')
                    : <span className="text-gray-400">尚未選擇</span>
                }
            </div>
        </td>
        <td className="border px-2 py-1">
            <select value={editFields.status || '待開始'} onChange={e => onFieldChange('status', e.target.value)} className="border p-1 w-full">
                <option value="待開始">待開始</option>
                <option value="進行中">進行中</option>
                <option value="已完成">已完成</option>
                <option value="已取消">已取消</option>
            </select>
        </td>
        <td className="border px-2 py-1"><input type="number" value={editFields.priority || 1} onChange={e => onFieldChange('priority', Number(e.target.value))} className="border p-1 w-full" /></td>
        <td className="border px-2 py-1">
            <select value={editFields.region || '北部'} onChange={e => onFieldChange('region', e.target.value)} className="border p-1 w-full">
                <option value="北部">北部</option>
                <option value="中部">中部</option>
                <option value="南部">南部</option>
                <option value="東部">東部</option>
                <option value="離島">離島</option>
            </select>
        </td>
        <td className="border px-2 py-1"><input value={editFields.address || ''} onChange={e => onFieldChange('address', e.target.value)} className="border p-1 w-full" /></td>
        <td className="border px-2 py-1 flex gap-2">
            <button onClick={onSave} className="bg-green-500 text-white px-2 py-1 rounded">儲存</button>
            <button onClick={onCancel} className="bg-gray-300 px-2 py-1 rounded">取消</button>
        </td>
    </>
);

// 檢視列
interface EpicViewRowProps {
    epic: WorkEpicEntity;
    onEdit: () => void;
    onDelete: () => void;
    progress: { completed: number; total: number; percent: number };
}
const EpicViewRow = ({ epic, onEdit, onDelete, progress }: EpicViewRowProps) => (
    <>
        <td className="border px-2 py-1 w-52"><ProgressBar {...progress} /></td>
        <td className="border px-2 py-1">{epic.title}</td>
        <td className="border px-2 py-1">{epic.startDate}</td>
        <td className="border px-2 py-1">{epic.endDate}</td>
        <td className="border px-2 py-1">{epic.insuranceStatus || '無'}</td>
        <td className="border px-2 py-1">{epic.owner?.name}</td>
        <td className="border px-2 py-1">{Array.isArray(epic.siteSupervisors) && epic.siteSupervisors.length > 0 ? (epic.siteSupervisors as MemberWithIdName[]).map(s => s.name).join('、') : '-'}</td>
        <td className="border px-2 py-1">{Array.isArray(epic.safetyOfficers) && epic.safetyOfficers.length > 0 ? (epic.safetyOfficers as MemberWithIdName[]).map(s => s.name).join('、') : '-'}</td>
        <td className="border px-2 py-1">{epic.status}</td>
        <td className="border px-2 py-1">{epic.priority}</td>
        <td className="border px-2 py-1">{epic.region}</td>
        <td className="border px-2 py-1">{epic.address}</td>
        <td className="border px-2 py-1 flex gap-2">
            <button onClick={onEdit} className="bg-yellow-400 text-white px-2 py-1 rounded">編輯</button>
            <button onClick={onDelete} className="bg-red-500 text-white px-2 py-1 rounded">刪除</button>
        </td>
    </>
);

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [newEpicTitle, setNewEpicTitle] = useState('');
    const [newEpicOwner, setNewEpicOwner] = useState<MemberWithIdName | null>(null);
    const [newSiteSupervisors, setNewSiteSupervisors] = useState<MemberWithIdName[]>([]);
    const [newSafetyOfficers, setNewSafetyOfficers] = useState<MemberWithIdName[]>([]);
    const [newEpicAddress, setNewEpicAddress] = useState('');
    const [editingEpicId, setEditingEpicId] = useState<string | null>(null);
    const [editFields, setEditFields] = useState<Partial<WorkEpicEntity>>({});
    const [members, setMembers] = useState<WorkMember[]>([]);

    useEffect(() => {
        const fetchWorkEpics = async () => {
            const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
            const allTasks = await getAllWorkTasks() as WorkTaskEntity[];
            const epicsWithTasks = epics.map(epic => ({
                ...epic,
                workTasks: allTasks.filter(task => task.flowId && epic.workTasks && epic.workTasks.some(t => t.taskId === task.taskId) ? true : false)
            }));
            setWorkEpics(epicsWithTasks);
        };
        const fetchMembers = async () => {
            const data = await getAllWorkMembers();
            setMembers(data);
        };
        fetchWorkEpics();
        fetchMembers();
    }, []);

    const handleAddEpic = async () => {
        if (!newEpicTitle.trim()) {
            alert("請輸入標的標題！");
            return;
        }
        if (!newEpicOwner) {
            alert("請選擇負責人！");
            return;
        }
        if (!newEpicAddress.trim()) {
            alert("請輸入地址！");
            return;
        }

        const newEpic: WorkEpicEntity = {
            epicId: `epic-${Date.now()}`,
            title: newEpicTitle,
            startDate: '',
            endDate: '',
            insuranceStatus: '無',
            owner: newEpicOwner,
            siteSupervisors: newSiteSupervisors,
            safetyOfficers: newSafetyOfficers,
            status: '待開始',
            priority: 1,
            region: '北部',
            address: newEpicAddress,
            createdAt: new Date().toISOString()
        };

        await addWorkEpic(newEpic);
        setWorkEpics(prev => [...prev, newEpic]);
        setNewEpicTitle('');
        setNewEpicOwner(null);
        setNewSiteSupervisors([]);
        setNewSafetyOfficers([]);
        setNewEpicAddress('');
    };

    const handleEditClick = (epic: WorkEpicEntity) => {
        setEditingEpicId(epic.epicId);
        setEditFields({ ...epic });
    };

    const handleEditFieldChange = (
        field: keyof WorkEpicEntity,
        value: string | number | boolean | MemberWithIdName | MemberWithIdName[] | undefined
    ) => {
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
        let total = 0, completed = 0;
        if (epic.workTasks) {
            epic.workTasks.forEach(task => {
                total += task.targetQuantity;
                completed += task.completedQuantity;
            });
        }
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percent };
    };

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作標的列表</h1>
                {/* 新增標的區域 */}
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        value={newEpicTitle}
                        onChange={e => setNewEpicTitle(e.target.value)}
                        placeholder="輸入新標的標題"
                        className="border p-2 mr-2"
                    />
                    <SingleSelect
                        value={newEpicOwner?.memberId || ''}
                        onChange={val => {
                            const member = members.find(m => m.memberId === val);
                            setNewEpicOwner(member ? { memberId: member.memberId, name: member.name } : null);
                        }}
                        options={members}
                        placeholder="選擇負責人"
                    />
                    <div className="flex flex-col">
                        <MultiSelect
                            value={newSiteSupervisors.map(s => s.memberId)}
                            onChange={selected => setNewSiteSupervisors(members.filter(m => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name })))}
                            options={members}
                            placeholder="選擇現場監督"
                        />
                        <div className="text-xs mt-1 text-gray-700 break-words min-h-[19px]">
                            {newSiteSupervisors.length > 0
                                ? newSiteSupervisors.map(s => s.name).join('、')
                                : <span className="text-gray-400">尚未選擇</span>
                            }
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <MultiSelect
                            value={newSafetyOfficers.map(s => s.memberId)}
                            onChange={selected => setNewSafetyOfficers(members.filter(m => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name })))}
                            options={members}
                            placeholder="選擇安全員"
                        />
                        <div className="text-xs mt-1 text-gray-700 break-words min-h-[19px]">
                            {newSafetyOfficers.length > 0
                                ? newSafetyOfficers.map(s => s.name).join('、')
                                : <span className="text-gray-400">尚未選擇</span>
                            }
                        </div>
                    </div>
                    <input
                        type="text"
                        value={newEpicAddress}
                        onChange={e => setNewEpicAddress(e.target.value)}
                        placeholder="輸入地址"
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
                            <th className="border border-gray-300 px-4 py-2 w-52">進度</th>
                            <th className="border border-gray-300 px-4 py-2">標題</th>
                            <th className="border border-gray-300 px-4 py-2">開始時間</th>
                            <th className="border border-gray-300 px-4 py-2">結束時間</th>
                            <th className="border border-gray-300 px-4 py-2">保險狀態</th>
                            <th className="border border-gray-300 px-4 py-2">負責人</th>
                            <th className="border border-gray-300 px-4 py-2">現場監督</th>
                            <th className="border border-gray-300 px-4 py-2">安全員</th>
                            <th className="border border-gray-300 px-4 py-2">狀態</th>
                            <th className="border border-gray-300 px-4 py-2">優先級</th>
                            <th className="border border-gray-300 px-4 py-2">地點</th>
                            <th className="border border-gray-300 px-4 py-2">地址</th>
                            <th className="border border-gray-300 px-4 py-2">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workEpics.map(epic => {
                            const progress = getEpicProgress(epic);
                            return (
                                <tr key={epic.epicId}>
                                    {editingEpicId === epic.epicId ? (
                                        <EpicEditRow
                                            editFields={editFields}
                                            members={members}
                                            onFieldChange={handleEditFieldChange}
                                            onSave={() => handleSaveEdit(epic.epicId)}
                                            onCancel={handleCancelEdit}
                                            progress={progress}
                                        />
                                    ) : (
                                        <EpicViewRow
                                            epic={epic}
                                            onEdit={() => handleEditClick(epic)}
                                            onDelete={() => handleDeleteEpic(epic.epicId)}
                                            progress={progress}
                                        />
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </main>
            <ManagementBottomNav />
        </>
    );
}