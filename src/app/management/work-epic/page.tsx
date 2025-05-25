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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workEpics.map(epic => {
                        const progress = getProgress(epic);
                        const editing = editingId === epic.epicId;
                        return (
                            <div key={epic.epicId} className="bg-white rounded shadow border border-gray-200 p-4 flex flex-col gap-2 relative">
                                {editing ? (
                                    <>
                                        <div className="mb-2"><ProgressBar {...progress} /></div>
                                        <input value={editFields.title || ''} onChange={e => handleEditField('title', e.target.value)} className="border p-1 w-full mb-1" placeholder="標題" />
                                        <div className="flex gap-2 mb-1">
                                            <input type="date" value={editFields.startDate ? String(editFields.startDate).slice(0, 10) : ''} onChange={e => handleEditField('startDate', e.target.value)} className="border p-1 w-full" />
                                            <input type="date" value={editFields.endDate ? String(editFields.endDate).slice(0, 10) : ''} onChange={e => handleEditField('endDate', e.target.value)} className="border p-1 w-full" />
                                        </div>
                                        <div className="flex gap-2 mb-1">
                                            <select value={editFields.insuranceStatus || '無'} onChange={e => handleEditField('insuranceStatus', e.target.value)} className="border p-1 w-full">
                                                <option value="無">無</option>
                                                <option value="有">有</option>
                                            </select>
                                            <select value={editFields.status || '待開始'} onChange={e => handleEditField('status', e.target.value)} className="border p-1 w-full">
                                                <option value="待開始">待開始</option>
                                                <option value="進行中">進行中</option>
                                                <option value="已完成">已完成</option>
                                                <option value="已取消">已取消</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 mb-1">
                                            <SingleSelect value={editFields.owner?.memberId || ''} onChange={val => {
                                                const m = members.find(mm => mm.memberId === val);
                                                handleEditField('owner', m ? { memberId: m.memberId, name: m.name } : undefined);
                                            }} options={members} placeholder="負責人" />
                                            <input type="number" value={editFields.priority || 1} onChange={e => handleEditField('priority', Number(e.target.value))} className="border p-1 w-full" placeholder="優先" />
                                        </div>
                                        <div className="flex gap-2 mb-1">
                                            <MultiSelect value={Array.isArray(editFields.siteSupervisors) ? editFields.siteSupervisors.map((s: MemberSimple) => s.memberId) : []}
                                                onChange={selected => handleEditField('siteSupervisors', members.filter(m => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name })))}
                                                options={members} placeholder="現場監督" />
                                            <MultiSelect value={Array.isArray(editFields.safetyOfficers) ? editFields.safetyOfficers.map((s: MemberSimple) => s.memberId) : []}
                                                onChange={selected => handleEditField('safetyOfficers', members.filter(m => selected.includes(m.memberId)).map(m => ({ memberId: m.memberId, name: m.name })))}
                                                options={members} placeholder="安全員" />
                                        </div>
                                        <div className="flex gap-2 mb-1">
                                            <select value={editFields.region || '北部'} onChange={e => handleEditField('region', e.target.value)} className="border p-1 w-full">
                                                <option value="北部">北部</option>
                                                <option value="中部">中部</option>
                                                <option value="南部">南部</option>
                                                <option value="東部">東部</option>
                                                <option value="離島">離島</option>
                                            </select>
                                            <input value={editFields.address || ''} onChange={e => handleEditField('address', e.target.value)} className="border p-1 w-full" placeholder="地址" />
                                        </div>
                                        <select multiple value={editWorkZoneIds} onChange={e => setEditWorkZoneIds(Array.from(e.target.selectedOptions).map(opt => opt.value))} className="border p-1 w-full mb-2">
                                            <option disabled value="">選擇工作區</option>
                                            {allWorkZones.map(z => (
                                                <option key={z.zoneId} value={z.zoneId}>{z.title}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleSave(epic.epicId)} className="bg-green-500 text-white px-2 py-1 rounded">儲存</button>
                                            <button onClick={handleCancel} className="bg-gray-300 px-2 py-1 rounded">取消</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-2"><ProgressBar {...progress} /></div>
                                        <div className="font-bold text-lg mb-1">{epic.title}</div>
                                        <div className="text-sm text-gray-600 mb-1">期間：{epic.startDate || '-'} ~ {epic.endDate || '-'}</div>
                                        <div className="flex flex-wrap gap-2 text-sm mb-1">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">保險：{epic.insuranceStatus || '無'}</span>
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">狀態：{epic.status}</span>
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">優先：{epic.priority}</span>
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">地區：{epic.region}</span>
                                        </div>
                                        <div className="text-sm mb-1">負責人：{epic.owner?.name || '-'}</div>
                                        <div className="text-sm mb-1">現場監督：{Array.isArray(epic.siteSupervisors) && epic.siteSupervisors.length > 0 ? epic.siteSupervisors.map((s: MemberSimple) => s.name).join('、') : '-'}</div>
                                        <div className="text-sm mb-1">安全員：{Array.isArray(epic.safetyOfficers) && epic.safetyOfficers.length > 0 ? epic.safetyOfficers.map((s: MemberSimple) => s.name).join('、') : '-'}</div>
                                        <div className="text-sm mb-1">地址：{epic.address}</div>
                                        <div className="text-sm mb-1">工作區：{Array.isArray(epic.workZones) && epic.workZones.length > 0 ? epic.workZones.map(z => z.title).join('、') : '-'}</div>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleEdit(epic)} className="bg-yellow-400 text-white px-2 py-1 rounded">編輯</button>
                                            <button onClick={() => handleDelete(epic.epicId)} className="bg-red-500 text-white px-2 py-1 rounded">刪除</button>
                                            <button onClick={() => handleAddWorkZone(epic)} className="bg-blue-500 text-white px-2 py-1 rounded">新增工作區</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
            <ManagementBottomNav />
        </>
    );
}