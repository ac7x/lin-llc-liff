'use client';

import {
    addWorkEpic,
    deleteWorkEpic,
    getAllWorkEpics,
    updateWorkEpic,
    WorkEpicEntity
} from '@/app/actions/workepic.action';
import { getAllWorkMembers, WorkMember } from '@/app/actions/workmember.action';
import { WorkZoneEntity } from '@/app/actions/workzone.action';
import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav';
import { useEffect, useState } from 'react';

type MemberSimple = { memberId: string; name: string };
const regionOptions = ['北部', '中部', '南部', '東部', '離島'] as const;

const shortId = (prefix = ''): string =>
    `${prefix}${Math.random().toString(36).slice(2, 8)}`;

const toISO = (date?: string | null): string => {
    if (!date) return '';
    if (date.includes('T')) {
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toISOString();
    }
    const d = new Date(`${date}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? '' : d.toISOString();
};

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

const SingleSelect = ({
    value, onChange, options, placeholder
}: {
    value: string;
    onChange: (val: string) => void;
    options: WorkMember[];
    placeholder: string;
}) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
    >
        <option value="">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.memberId} value={opt.memberId}>{opt.name}</option>
        ))}
    </select>
);

const MultiSelect = ({
    value, onChange, options, placeholder
}: {
    value: string[];
    onChange: (selected: string[]) => void;
    options: WorkMember[];
    placeholder: string;
}) => (
    <select
        multiple
        value={value}
        onChange={e => {
            const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
            onChange(selected);
        }}
        className="border rounded px-2 py-1 min-w-[100px] h-20 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
    >
        <option disabled value="">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.memberId} value={opt.memberId}>{opt.name}</option>
        ))}
    </select>
);

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [members, setMembers] = useState<WorkMember[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFields, setEditFields] = useState<Partial<WorkEpicEntity>>({});
    const [newTitle, setNewTitle] = useState('');
    const [newOwner, setNewOwner] = useState<MemberSimple | null>(null);
    const [newAddress, setNewAddress] = useState('');
    const [newSiteSupervisors, setNewSiteSupervisors] = useState<string[]>([]);
    const [newSafetyOfficers, setNewSafetyOfficers] = useState<string[]>([]);
    const [newRegion, setNewRegion] = useState<typeof regionOptions[number]>('北部');

    useEffect(() => {
        const fetchData = async () => {
            const [epics, allMembers] = await Promise.all([
                getAllWorkEpics(false) as Promise<WorkEpicEntity[]>,
                getAllWorkMembers()
            ]);
            setWorkEpics(epics);
            setMembers(allMembers);
        };
        fetchData();
    }, []);

    const getProgress = (epic: WorkEpicEntity) => {
        let total = 0, completed = 0;
        if (epic.workTasks) {
            epic.workTasks.forEach(t => {
                total += t.targetQuantity;
                completed += t.completedQuantity;
            });
        }
        return { completed, total };
    };

    const handleAdd = async () => {
        if (!newTitle.trim() || !newOwner || !newAddress.trim()) {
            alert("請完整填寫標題、負責人、地址");
            return;
        }
        const siteSupervisors = members.filter(m => newSiteSupervisors.includes(m.memberId)).map(m => ({
            memberId: m.memberId, name: m.name
        }));
        const safetyOfficers = members.filter(m => newSafetyOfficers.includes(m.memberId)).map(m => ({
            memberId: m.memberId, name: m.name
        }));
        const defaultZone: WorkZoneEntity = {
            zoneId: shortId('zone-'),
            title: "預設區域",
            address: "",
            createdAt: new Date().toISOString(),
            status: "啟用",
            region: newRegion
        };
        const newEpic: WorkEpicEntity = {
            epicId: shortId('epic-'),
            title: newTitle,
            startDate: "",
            endDate: "",
            insuranceStatus: "無",
            owner: newOwner,
            siteSupervisors,
            safetyOfficers,
            status: "待開始",
            priority: 1,
            region: newRegion,
            address: newAddress,
            createdAt: new Date().toISOString(),
            workZones: [defaultZone],
            workTypes: [],
            workFlows: [],
            workTasks: [],
            workLoads: []
        };
        try {
            await addWorkEpic(newEpic);
            setWorkEpics(prev => [...prev, newEpic]);
            setNewTitle('');
            setNewOwner(null);
            setNewAddress('');
            setNewSiteSupervisors([]);
            setNewSafetyOfficers([]);
            setNewRegion('北部');
        } catch {
            alert("建立失敗，請稍後再試");
        }
    };

    const handleEdit = (epic: WorkEpicEntity) => {
        setEditingId(epic.epicId);
        setEditFields({ ...epic });
    };
    const handleEditField = (field: keyof WorkEpicEntity, value: unknown) => {
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
            <div className="mb-4 flex flex-wrap gap-2 items-center">
                <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="標的標題"
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                />
                <SingleSelect
                    value={newOwner?.memberId || ''}
                    onChange={val => {
                        const m = members.find(mm => mm.memberId === val);
                        setNewOwner(m ? { memberId: m.memberId, name: m.name } : null);
                    }}
                    options={members}
                    placeholder="負責人"
                />
                <MultiSelect
                    value={newSiteSupervisors}
                    onChange={setNewSiteSupervisors}
                    options={members}
                    placeholder="現場監工"
                />
                <MultiSelect
                    value={newSafetyOfficers}
                    onChange={setNewSafetyOfficers}
                    options={members}
                    placeholder="安全人員"
                />
                <select
                    value={newRegion}
                    onChange={e => setNewRegion(e.target.value as typeof regionOptions[number])}
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
                >
                    {regionOptions.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                <input
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
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
                            <th className="px-2 py-2 text-left">進度</th>
                            <th className="px-2 py-2 text-left">標題</th>
                            <th className="px-2 py-2 text-left">開始</th>
                            <th className="px-2 py-2 text-left">結束</th>
                            <th className="px-2 py-2 text-left">負責人</th>
                            <th className="px-2 py-2 text-left">現場監工</th>
                            <th className="px-2 py-2 text-left">安全人員</th>
                            <th className="px-2 py-2 text-left">狀態</th>
                            <th className="px-2 py-2 text-left">優先</th>
                            <th className="px-2 py-2 text-left">區域</th>
                            <th className="px-2 py-2 text-left">地址</th>
                            <th className="px-2 py-2 text-left">工作區</th>
                            <th className="px-2 py-2">操作</th>
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
                                            <td className="px-2 py-1">
                                                <SingleSelect
                                                    value={editFields.owner?.memberId || ''}
                                                    onChange={val => {
                                                        const m = members.find(mm => mm.memberId === val);
                                                        handleEditField('owner', m ? { memberId: m.memberId, name: m.name } : undefined);
                                                    }}
                                                    options={members}
                                                    placeholder="負責人"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <MultiSelect
                                                    value={Array.isArray(editFields.siteSupervisors) ? editFields.siteSupervisors.map(s => s.memberId) : []}
                                                    onChange={selected => {
                                                        const selectedMembers = members.filter(m => selected.includes(m.memberId)).map(m => ({
                                                            memberId: m.memberId,
                                                            name: m.name
                                                        }));
                                                        handleEditField('siteSupervisors', selectedMembers);
                                                    }}
                                                    options={members}
                                                    placeholder="現場監工"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <MultiSelect
                                                    value={Array.isArray(editFields.safetyOfficers) ? editFields.safetyOfficers.map(s => s.memberId) : []}
                                                    onChange={selected => {
                                                        const selectedMembers = members.filter(m => selected.includes(m.memberId)).map(m => ({
                                                            memberId: m.memberId,
                                                            name: m.name
                                                        }));
                                                        handleEditField('safetyOfficers', selectedMembers);
                                                    }}
                                                    options={members}
                                                    placeholder="安全人員"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <select
                                                    value={editFields.status || '待開始'}
                                                    onChange={e => handleEditField('status', e.target.value)}
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
                                                {(editFields.workZones && editFields.workZones.length > 0)
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
                                            <td className="px-2 py-1">
                                                {(epic.siteSupervisors && epic.siteSupervisors.length > 0)
                                                    ? epic.siteSupervisors.map(s => s.name).join(', ')
                                                    : '—'}
                                            </td>
                                            <td className="px-2 py-1">
                                                {(epic.safetyOfficers && epic.safetyOfficers.length > 0)
                                                    ? epic.safetyOfficers.map(s => s.name).join(', ')
                                                    : '—'}
                                            </td>
                                            <td className="px-2 py-1">{epic.status}</td>
                                            <td className="px-2 py-1">{epic.priority}</td>
                                            <td className="px-2 py-1">{epic.region}</td>
                                            <td className="px-2 py-1">{epic.address}</td>
                                            <td className="px-2 py-1">
                                                {(epic.workZones && epic.workZones.length > 0)
                                                    ? epic.workZones.map(z => z.title).join(', ')
                                                    : '—'}
                                            </td>
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