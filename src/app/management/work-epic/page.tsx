'use client';
import {
    addWorkEpic, deleteWorkEpic, getAllWorkEpics, updateWorkEpic, WorkEpicEntity,
} from '@/app/actions/workepic.action';
import { getAllWorkMembers, WorkMember } from '@/app/actions/workmember.action';
import { getAllWorkTasks, WorkTaskEntity } from '@/app/actions/worktask.action';
import { addWorkZone, getAllWorkZones, WorkZoneEntity } from '@/app/actions/workzone.action';
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import { useEffect, useState } from 'react';

function shortId(prefix = ''): string {
    return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}
function toISO(date: string | undefined | null): string {
    if (!date) return '';
    if (date.includes('T')) {
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toISOString();
    }
    const d = new Date(date + 'T00:00:00.000Z');
    return isNaN(d.getTime()) ? '' : d.toISOString();
}

const ProgressBar = ({ completed, total }: { completed: number, total: number }) => {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
        <div>
            <div className="w-full bg-gray-200 rounded h-3">
                <div className="bg-green-500 h-3 rounded" style={{ width: `${percent}%` }} />
            </div>
            <div className="text-xs text-right">{completed}/{total}（{percent}%）</div>
        </div>
    );
};

const SingleSelect = ({
    value, onChange, options, placeholder,
}: { value: string, onChange: (val: string) => void, options: WorkMember[], placeholder: string }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="border p-1">
        <option value="">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.memberId} value={opt.memberId}>{opt.name}</option>
        ))}
    </select>
);

const MultiSelect = ({
    value, onChange, options, placeholder,
}: { value: string[], onChange: (selected: string[]) => void, options: WorkMember[], placeholder: string }) => (
    <select
        multiple
        value={value}
        onChange={e => {
            const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
            onChange(selected);
        }}
        className="border p-1 min-w-[100px] h-[80px]"
    >
        <option disabled value="">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.memberId} value={opt.memberId}>{opt.name}</option>
        ))}
    </select>
);

type MemberSimple = { memberId: string, name: string };

export default function WorkEpicPage() {
    const [workEpics, setWorkEpics] = useState<WorkEpicEntity[]>([]);
    const [members, setMembers] = useState<WorkMember[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFields, setEditFields] = useState<Partial<WorkEpicEntity>>({});
    const [allWorkZones, setAllWorkZones] = useState<WorkZoneEntity[]>([]);
    const [editWorkZoneIds, setEditWorkZoneIds] = useState<string[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newOwner, setNewOwner] = useState<MemberSimple | null>(null);
    const [newSiteSupervisors, setNewSiteSupervisors] = useState<MemberSimple[]>([]);
    const [newSafetyOfficers, setNewSafetyOfficers] = useState<MemberSimple[]>([]);
    const [newAddress, setNewAddress] = useState('');

    useEffect(() => {
        (async () => {
            const epics = await getAllWorkEpics(false) as WorkEpicEntity[];
            const tasks = await getAllWorkTasks() as WorkTaskEntity[];
            setWorkEpics(epics.map(epic => ({
                ...epic,
                workTasks: tasks.filter(t => epic.workTasks?.some(wt => wt.taskId === t.taskId)),
            })));
            setMembers(await getAllWorkMembers());
            setAllWorkZones(await getAllWorkZones() as WorkZoneEntity[]);
        })();
    }, []);

    const getProgress = (epic: WorkEpicEntity) => {
        let total = 0, completed = 0;
        if (epic.workTasks) epic.workTasks.forEach(t => {
            total += t.targetQuantity;
            completed += t.completedQuantity;
        });
        return { completed, total };
    };

    const handleAdd = async () => {
        if (!newTitle.trim() || !newOwner || !newAddress.trim()) {
            alert('請完整填寫標題、負責人、地址');
            return;
        }
        const newEpic: WorkEpicEntity = {
            epicId: shortId('epic-'),
            title: newTitle,
            startDate: '',
            endDate: '',
            insuranceStatus: '無',
            owner: newOwner,
            siteSupervisors: newSiteSupervisors,
            safetyOfficers: newSafetyOfficers,
            status: '待開始',
            priority: 1,
            region: '北部',
            address: newAddress,
            createdAt: new Date().toISOString(),
            workZones: [],
            workTypes: [],
            workFlows: [],
            workTasks: [],
            workLoads: [],
        };
        newEpic.startDate = toISO(newEpic.startDate);
        newEpic.endDate = toISO(newEpic.endDate);
        try {
            await addWorkEpic(newEpic);
            setWorkEpics(prev => [...prev, newEpic]);
            setNewTitle('');
            setNewOwner(null);
            setNewSiteSupervisors([]);
            setNewSafetyOfficers([]);
            setNewAddress('');
        } catch {
            alert('建立失敗，請稍後再試');
        }
    };

    const handleEdit = (epic: WorkEpicEntity) => {
        setEditingId(epic.epicId);
        setEditFields({ ...epic });
        setEditWorkZoneIds(Array.isArray(epic.workZones) ? epic.workZones.map(z => z.zoneId) : []);
    };
    const handleEditField = (field: keyof WorkEpicEntity, value: unknown) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };
    const handleSave = async (epicId: string) => {
        const selectedZones = allWorkZones.filter(z => editWorkZoneIds.includes(z.zoneId));
        const updates: Partial<WorkEpicEntity> = {
            ...editFields,
            startDate: toISO(editFields.startDate as string),
            endDate: toISO(editFields.endDate as string),
            workZones: selectedZones
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
        if (window.confirm('確定要刪除這個標的嗎？')) {
            await deleteWorkEpic(epicId);
            setWorkEpics(prev => prev.filter(e => e.epicId !== epicId));
        }
    };
    const handleAddWorkZone = async (epic: WorkEpicEntity) => {
        const name = window.prompt('請輸入新工作區名稱：');
        if (!name) return;
        const newZone: WorkZoneEntity = {
            zoneId: shortId('zone-'),
            title: name,
            region: epic.region,
            address: '',
            createdAt: new Date().toISOString(),
            status: '啟用'
        };
        await addWorkZone(epic.epicId, newZone);
        const updatedZones = [...(epic.workZones || []), newZone];
        await updateWorkEpic(epic.epicId, { workZones: updatedZones });
        setWorkEpics(prev => prev.map(e => e.epicId === epic.epicId ? { ...e, workZones: updatedZones } : e));
        alert('已建立新工作區！');
    };

    return (
        <>
            <main className="p-4">
                <h1 className="text-2xl font-bold mb-4">工作標的列表</h1>
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="標的標題" className="border p-1" />
                    <SingleSelect value={newOwner?.memberId || ''} onChange={val => {
                        const m = members.find(mm => mm.memberId === val);
                        setNewOwner(m ? { memberId: m.memberId, name: m.name } : null);
                    }} options={members} placeholder="負責人" />
                    <MultiSelect value={newSiteSupervisors.map(s => s.memberId)} onChange={selected => {
                        setNewSiteSupervisors(members.filter(m => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name })));
                    }} options={members} placeholder="現場監督" />
                    <MultiSelect value={newSafetyOfficers.map(s => s.memberId)} onChange={selected => {
                        setNewSafetyOfficers(members.filter(m => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name })));
                    }} options={members} placeholder="安全員" />
                    <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="地址" className="border p-1" />
                    <button onClick={handleAdd} className="bg-blue-500 text-white px-3 py-1 rounded">建立</button>
                </div>
                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border px-2 py-1 w-52">進度</th>
                            <th className="border px-2 py-1">標題</th>
                            <th className="border px-2 py-1">開始</th>
                            <th className="border px-2 py-1">結束</th>
                            <th className="border px-2 py-1">保險</th>
                            <th className="border px-2 py-1">負責人</th>
                            <th className="border px-2 py-1">現場監督</th>
                            <th className="border px-2 py-1">安全員</th>
                            <th className="border px-2 py-1">狀態</th>
                            <th className="border px-2 py-1">優先</th>
                            <th className="border px-2 py-1">地區</th>
                            <th className="border px-2 py-1">地址</th>
                            <th className="border px-2 py-1">工作區</th>
                            <th className="border px-2 py-1">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workEpics.map(epic => {
                            const progress = getProgress(epic);
                            const editing = editingId === epic.epicId;
                            return (
                                <tr key={epic.epicId}>
                                    {editing ? (
                                        <>
                                            <td className="border px-2 py-1 w-52"><ProgressBar {...progress} /></td>
                                            <td className="border px-2 py-1"><input value={editFields.title || ''} onChange={e => handleEditField('title', e.target.value)} className="border p-1 w-full" /></td>
                                            <td className="border px-2 py-1"><input type="date" value={editFields.startDate ? String(editFields.startDate).slice(0, 10) : ''} onChange={e => handleEditField('startDate', e.target.value)} className="border p-1 w-full" /></td>
                                            <td className="border px-2 py-1"><input type="date" value={editFields.endDate ? String(editFields.endDate).slice(0, 10) : ''} onChange={e => handleEditField('endDate', e.target.value)} className="border p-1 w-full" /></td>
                                            <td className="border px-2 py-1">
                                                <select value={editFields.insuranceStatus || '無'} onChange={e => handleEditField('insuranceStatus', e.target.value)} className="border p-1 w-full">
                                                    <option value="無">無</option>
                                                    <option value="有">有</option>
                                                </select>
                                            </td>
                                            <td className="border px-2 py-1">
                                                <SingleSelect value={editFields.owner?.memberId || ''} onChange={val => {
                                                    const m = members.find(mm => mm.memberId === val);
                                                    handleEditField('owner', m ? { memberId: m.memberId, name: m.name } : undefined);
                                                }} options={members} placeholder="負責人" />
                                            </td>
                                            <td className="border px-2 py-1">
                                                <MultiSelect value={Array.isArray(editFields.siteSupervisors) ? editFields.siteSupervisors.map((s: MemberSimple) => s.memberId) : []}
                                                    onChange={selected => handleEditField('siteSupervisors', members.filter(m => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name })))}
                                                    options={members} placeholder="現場監督" />
                                            </td>
                                            <td className="border px-2 py-1">
                                                <MultiSelect value={Array.isArray(editFields.safetyOfficers) ? editFields.safetyOfficers.map((s: MemberSimple) => s.memberId) : []}
                                                    onChange={selected => handleEditField('safetyOfficers', members.filter(m => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name })))}
                                                    options={members} placeholder="安全員" />
                                            </td>
                                            <td className="border px-2 py-1">
                                                <select value={editFields.status || '待開始'} onChange={e => handleEditField('status', e.target.value)} className="border p-1 w-full">
                                                    <option value="待開始">待開始</option>
                                                    <option value="進行中">進行中</option>
                                                    <option value="已完成">已完成</option>
                                                    <option value="已取消">已取消</option>
                                                </select>
                                            </td>
                                            <td className="border px-2 py-1"><input type="number" value={editFields.priority || 1} onChange={e => handleEditField('priority', Number(e.target.value))} className="border p-1 w-full" /></td>
                                            <td className="border px-2 py-1">
                                                <select value={editFields.region || '北部'} onChange={e => handleEditField('region', e.target.value)} className="border p-1 w-full">
                                                    <option value="北部">北部</option>
                                                    <option value="中部">中部</option>
                                                    <option value="南部">南部</option>
                                                    <option value="東部">東部</option>
                                                    <option value="離島">離島</option>
                                                </select>
                                            </td>
                                            <td className="border px-2 py-1"><input value={editFields.address || ''} onChange={e => handleEditField('address', e.target.value)} className="border p-1 w-full" /></td>
                                            <td className="border px-2 py-1">
                                                <select multiple value={editWorkZoneIds} onChange={e => setEditWorkZoneIds(Array.from(e.target.selectedOptions).map(opt => opt.value))} className="border p-1 w-full">
                                                    <option disabled value="">選擇工作區</option>
                                                    {allWorkZones.map(z => (
                                                        <option key={z.zoneId} value={z.zoneId}>{z.title}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="border px-2 py-1 flex gap-2">
                                                <button onClick={() => handleSave(epic.epicId)} className="bg-green-500 text-white px-2 py-1 rounded">儲存</button>
                                                <button onClick={handleCancel} className="bg-gray-300 px-2 py-1 rounded">取消</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="border px-2 py-1 w-52"><ProgressBar {...progress} /></td>
                                            <td className="border px-2 py-1">{epic.title}</td>
                                            <td className="border px-2 py-1">{epic.startDate}</td>
                                            <td className="border px-2 py-1">{epic.endDate}</td>
                                            <td className="border px-2 py-1">{epic.insuranceStatus || '無'}</td>
                                            <td className="border px-2 py-1">{epic.owner?.name}</td>
                                            <td className="border px-2 py-1">{Array.isArray(epic.siteSupervisors) && epic.siteSupervisors.length > 0 ? epic.siteSupervisors.map((s: MemberSimple) => s.name).join('、') : '-'}</td>
                                            <td className="border px-2 py-1">{Array.isArray(epic.safetyOfficers) && epic.safetyOfficers.length > 0 ? epic.safetyOfficers.map((s: MemberSimple) => s.name).join('、') : '-'}</td>
                                            <td className="border px-2 py-1">{epic.status}</td>
                                            <td className="border px-2 py-1">{epic.priority}</td>
                                            <td className="border px-2 py-1">{epic.region}</td>
                                            <td className="border px-2 py-1">{epic.address}</td>
                                            <td className="border px-2 py-1">{Array.isArray(epic.workZones) && epic.workZones.length > 0 ? epic.workZones.map(z => z.title).join('、') : '-'}</td>
                                            <td className="border px-2 py-1 flex gap-2">
                                                <button onClick={() => handleEdit(epic)} className="bg-yellow-400 text-white px-2 py-1 rounded">編輯</button>
                                                <button onClick={() => handleDelete(epic.epicId)} className="bg-red-500 text-white px-2 py-1 rounded">刪除</button>
                                                <button onClick={() => handleAddWorkZone(epic)} className="bg-blue-500 text-white px-2 py-1 rounded">新增工作區</button>
                                            </td>
                                        </>
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