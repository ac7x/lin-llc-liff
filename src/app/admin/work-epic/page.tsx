'use client';

import {
    addWorkEpic,
    deleteWorkEpic,
    getAllWorkEpics,
    updateWorkEpic,
    WorkEpicEntity
} from '@/app/actions/workepic.action';
import { getAllWorkMembers, WorkMember } from '@/app/actions/workmember.action';
import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav';
import { useEffect, useState } from 'react';

const regionOptions = ["北部", "中部", "南部", "東部", "離島"] as const;

const shortId = (prefix = '') =>
    `${prefix}${Math.random().toString(36).slice(2, 8)}`;

const toISO = (date?: string | null): string =>
    date ? new Date(date.includes('T') ? date : `${date}T00:00:00.000Z`).toISOString() : '';

/** 進度條元件 */
const ProgressBar = ({ completed, total }: { completed: number; total: number }) => {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
        <div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2">
                <div className="bg-green-500 dark:bg-green-600 h-2 rounded" style={{ width: `${percent}%` }} />
            </div>
            <div className="text-xs text-right text-gray-500 dark:text-gray-300">
                {completed}/{total}（{percent}%）
            </div>
        </div>
    );
};

type FormFields = {
    title: string;
    owner: { memberId: string; name: string } | null;
    address: string;
    siteSupervisors: string[];
    safetyOfficers: string[];
    region: typeof regionOptions[number];
};

const defaultForm: FormFields = {
    title: '',
    owner: null,
    address: '',
    siteSupervisors: [],
    safetyOfficers: [],
    region: "北部"
};

/** 通用選擇元件 */
const Select = ({
    value,
    onChange,
    options,
    placeholder,
    multiple
}: {
    value: string | string[];
    onChange: (val: string | string[]) => void;
    options: WorkMember[];
    placeholder: string;
    multiple?: boolean;
}) => (
    <select
        multiple={multiple}
        value={value}
        onChange={e =>
            onChange(
                multiple
                    ? Array.from(e.target.selectedOptions).map(opt => opt.value)
                    : e.target.value
            )
        }
        className={`border rounded px-2 py-1 ${multiple ? 'min-w-[100px] h-20' : ''} bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none`}
    >
        <option value="" disabled={!!multiple}>{placeholder}</option>
        {options.map(opt => (
            <option key={opt.memberId} value={opt.memberId}>{opt.name}</option>
        ))}
    </select>
);

const getProgress = (epic: WorkEpicEntity) => {
    let total = 0, completed = 0;
    epic.workTasks?.forEach(t => {
        total += t.targetQuantity;
        completed += t.completedQuantity;
    });
    return { completed, total };
};

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [members, setMembers] = useState<WorkMember[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFields, setEditFields] = useState<Partial<WorkEpicEntity>>({});
    const [form, setForm] = useState<FormFields>(defaultForm);

    useEffect(() => {
        void (async () => {
            const [epics, allMembers] = await Promise.all([
                getAllWorkEpics(false) as Promise<WorkEpicEntity[]>,
                getAllWorkMembers()
            ]);
            setWorkEpics(epics);
            setMembers(allMembers);
        })();
    }, []);

    const handleFormChange = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const handleAdd = async () => {
        const { title, owner, address, siteSupervisors, safetyOfficers, region } = form;
        if (!title.trim() || !owner || !address.trim()) {
            alert("請完整填寫標題、負責人、地址");
            return;
        }
        const toMemberObjs = (ids: string[]) =>
            members.filter(m => ids.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name }));

        const newEpic: WorkEpicEntity = {
            epicId: shortId('epic-'),
            title,
            startDate: "",
            endDate: "",
            insuranceStatus: "無",
            owner,
            siteSupervisors: toMemberObjs(siteSupervisors),
            safetyOfficers: toMemberObjs(safetyOfficers),
            status: "待開始",
            priority: 1,
            region,
            address,
            createdAt: new Date().toISOString(),
            workZones: [{
                zoneId: shortId('zone-'),
                title: "預設區域",
                address: "",
                createdAt: new Date().toISOString(),
                status: "啟用",
                region
            }],
            workTypes: [],
            workFlows: [],
            workTasks: [],
            workLoads: []
        };
        try {
            await addWorkEpic(newEpic);
            setWorkEpics(prev => [...prev, newEpic]);
            setForm(defaultForm);
        } catch {
            alert("建立失敗，請稍後再試");
        }
    };

    const handleEdit = (epic: WorkEpicEntity) => {
        setEditingId(epic.epicId);
        setEditFields({ ...epic });
    };

    const handleEditField = <K extends keyof WorkEpicEntity>(field: K, value: WorkEpicEntity[K]) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (epicId: string) => {
        const updates: Partial<WorkEpicEntity> = {
            ...editFields,
            startDate: toISO(editFields.startDate as string),
            endDate: toISO(editFields.endDate as string)
        };
        await updateWorkEpic(epicId, updates);
        setWorkEpics(prev => prev.map(e => e.epicId === epicId ? { ...e, ...updates } : e));
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditFields({});
    };

    const handleDelete = async (epicId: string) => {
        if (window.confirm("確定要刪除這個標的嗎？")) {
            await deleteWorkEpic(epicId);
            setWorkEpics(prev => prev.filter(e => e.epicId !== epicId));
        }
    };

    return (
        <main className="p-4 min-h-screen bg-white dark:bg-gray-950 transition-colors">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">工作標的列表</h1>
            {/* 新增表單區塊 */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
                <input
                    value={form.title}
                    onChange={e => handleFormChange('title', e.target.value)}
                    placeholder="標的標題"
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                />
                {/* 將 負責人 現場監工 安全人員 包一起，永遠同排 */}
                <div className="flex gap-2 flex-nowrap">
                    <Select
                        value={form.owner?.memberId || ''}
                        onChange={val => {
                            const m = members.find(mm => mm.memberId === val);
                            handleFormChange('owner', m ? { memberId: m.memberId, name: m.name } : null);
                        }}
                        options={members}
                        placeholder="負責人"
                    />
                    <Select
                        value={form.siteSupervisors}
                        onChange={selected => handleFormChange('siteSupervisors', selected as string[])}
                        options={members}
                        placeholder="現場監工"
                        multiple
                    />
                    <Select
                        value={form.safetyOfficers}
                        onChange={selected => handleFormChange('safetyOfficers', selected as string[])}
                        options={members}
                        placeholder="安全人員"
                        multiple
                    />
                </div>
                <select
                    value={form.region}
                    onChange={e => handleFormChange('region', e.target.value as typeof regionOptions[number])}
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                >
                    {regionOptions.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                <input
                    value={form.address}
                    onChange={e => handleFormChange('address', e.target.value)}
                    placeholder="地址"
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                />
                <button
                    onClick={handleAdd}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                >
                    建立
                </button>
            </div>
            <div className="overflow-x-auto bg-white dark:bg-gray-950 rounded-lg shadow">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            {["進度", "標題", "開始", "結束", "負責人", "現場監工", "安全人員", "狀態", "優先", "區域", "地址", "工作區", "操作"].map(t =>
                                <th key={t} className="px-2 py-2 text-left">{t}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {workEpics.map(epic => {
                            const progress = getProgress(epic);
                            const editing = editingId === epic.epicId;
                            return (
                                <tr key={epic.epicId} className="border-b border-gray-200 dark:border-gray-800">
                                    {editing ? (
                                        <>
                                            <td className="px-2 py-1"><ProgressBar {...progress} /></td>
                                            <td className="px-2 py-1">
                                                <input
                                                    value={editFields.title || ''}
                                                    onChange={e => handleEditField('title', e.target.value)}
                                                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="date"
                                                    value={editFields.startDate ? String(editFields.startDate).slice(0, 10) : ''}
                                                    onChange={e => handleEditField('startDate', e.target.value)}
                                                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="date"
                                                    value={editFields.endDate ? String(editFields.endDate).slice(0, 10) : ''}
                                                    onChange={e => handleEditField('endDate', e.target.value)}
                                                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                                                />
                                            </td>
                                            {/* 編輯狀態下也包在同一排 */}
                                            <td className="px-2 py-1" colSpan={3}>
                                                <div className="flex gap-2 flex-nowrap">
                                                    <Select
                                                        value={editFields.owner?.memberId || ''}
                                                        onChange={val => {
                                                            const m = members.find(mm => mm.memberId === val);
                                                            if (m) handleEditField('owner', { memberId: m.memberId, name: m.name });
                                                        }}
                                                        options={members}
                                                        placeholder="負責人"
                                                    />
                                                    <Select
                                                        value={Array.isArray(editFields.siteSupervisors) ? editFields.siteSupervisors.map(s => s.memberId) : []}
                                                        onChange={selected => {
                                                            const selectedMembers = members.filter(m => (selected as string[]).includes(m.memberId)).map(m => ({
                                                                memberId: m.memberId, name: m.name
                                                            }));
                                                            handleEditField('siteSupervisors', selectedMembers);
                                                        }}
                                                        options={members}
                                                        placeholder="現場監工"
                                                        multiple
                                                    />
                                                    <Select
                                                        value={Array.isArray(editFields.safetyOfficers) ? editFields.safetyOfficers.map(s => s.memberId) : []}
                                                        onChange={selected => {
                                                            const selectedMembers = members.filter(m => (selected as string[]).includes(m.memberId)).map(m => ({
                                                                memberId: m.memberId, name: m.name
                                                            }));
                                                            handleEditField('safetyOfficers', selectedMembers);
                                                        }}
                                                        options={members}
                                                        placeholder="安全人員"
                                                        multiple
                                                    />
                                                </div>
                                            </td>
                                            {/* 因合併欄位，這裡跳過原本的兩個欄位 */}
                                            {/* 狀態、優先、區域、地址、工作區、操作 */}
                                            <td className="px-2 py-1">
                                                <select
                                                    value={editFields.status || '待開始'}
                                                    onChange={e => handleEditField('status', e.target.value as WorkEpicEntity['status'])}
                                                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                                                >
                                                    <option value="待開始">待開始</option>
                                                    <option value="進行中">進行中</option>
                                                    <option value="已完成">已完成</option>
                                                    <option value="已取消">已取消</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    value={editFields.priority || 1}
                                                    onChange={e => handleEditField('priority', Number(e.target.value))}
                                                    className="border rounded px-2 py-1 w-16 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <select
                                                    value={editFields.region || '北部'}
                                                    onChange={e => handleEditField('region', e.target.value as typeof regionOptions[number])}
                                                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                                                >
                                                    {regionOptions.map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    value={editFields.address || ''}
                                                    onChange={e => handleEditField('address', e.target.value)}
                                                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                {editFields.workZones?.length
                                                    ? editFields.workZones.map(z => z.title).join(', ')
                                                    : '—'}
                                            </td>
                                            <td className="px-2 py-1 flex gap-2">
                                                <button
                                                    onClick={() => handleSave(epic.epicId)}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition"
                                                >儲存</button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:text-white px-2 py-1 rounded transition"
                                                >取消</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-2 py-1"><ProgressBar {...progress} /></td>
                                            <td className="px-2 py-1">{epic.title}</td>
                                            <td className="px-2 py-1">{epic.startDate?.slice(0, 10)}</td>
                                            <td className="px-2 py-1">{epic.endDate?.slice(0, 10)}</td>
                                            <td className="px-2 py-1">{epic.owner?.name}</td>
                                            <td className="px-2 py-1">{epic.siteSupervisors?.length ? epic.siteSupervisors.map(s => s.name).join(', ') : '—'}</td>
                                            <td className="px-2 py-1">{epic.safetyOfficers?.length ? epic.safetyOfficers.map(s => s.name).join(', ') : '—'}</td>
                                            <td className="px-2 py-1">{epic.status}</td>
                                            <td className="px-2 py-1">{epic.priority}</td>
                                            <td className="px-2 py-1">{epic.region}</td>
                                            <td className="px-2 py-1">{epic.address}</td>
                                            <td className="px-2 py-1">{epic.workZones?.length ? epic.workZones.map(z => z.title).join(', ') : '—'}</td>
                                            <td className="px-2 py-1 flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(epic)}
                                                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded transition"
                                                >編輯</button>
                                                <button
                                                    onClick={() => handleDelete(epic.epicId)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition"
                                                >刪除</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <AdminBottomNav />
        </main>
    );
}