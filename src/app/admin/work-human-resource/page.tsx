'use client'
import { LiffContext } from '@/modules/line/liff/interfaces/Liff'
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp'
import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav'
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, query, updateDoc } from 'firebase/firestore'
import { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'

type WorkSkill = {
    skillID: string
    name: string
    category: string
    level: number
    isMandatory: boolean
}
type WorkMember = {
    memberId: string
    name: string
    role: string
    skills: string[]
    availability: '空閒' | '忙碌' | '請假' | '離線'
    assignedEpicIDs?: string[]
    contactInfo: {
        email?: string
        phone?: string
        lineId?: string
    }
    status: '在職' | '離職' | '暫停合作' | '黑名單'
    isActive: boolean
    lastActiveTime: string
}
type UpdatedFields = {
    name?: string
    role?: string
    skills?: string
    availability?: WorkMember['availability']
    status?: WorkMember['status']
    email?: string
    phone?: string
    lineId?: string
}

const TAB_SKILL = 'skill'
const TAB_MEMBER = 'member'

export default function WorkHumanPage() {
    const { isLoggedIn, firebaseLogin } = useContext(LiffContext)
    const [activeTab, setActiveTab] = useState<typeof TAB_SKILL | typeof TAB_MEMBER>(TAB_MEMBER)

    // Skill state
    const skillsRef = collection(firestore, 'workSkill')
    const membersRef = collection(firestore, 'workMember')
    const [skillsSnap, , errorSkills] = useCollection(skillsRef)
    const [membersSnap] = useCollection(membersRef)
    const [form, setForm] = useState<Partial<WorkSkill>>({})
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showAddUser, setShowAddUser] = useState<string | null>(null)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    // Member state
    const [snapshot, , errorMembers] = useCollection(query(membersRef))
    const [filter, setFilter] = useState({ role: '', status: '' })
    const [sortKey, setSortKey] = useState<'name' | 'role'>('name')
    const [editingMember, setEditingMember] = useState<string | null>(null)
    const [updatedFields, setUpdatedFields] = useState<UpdatedFields>({})
    const [skillsMap, setSkillsMap] = useState<Record<string, string>>({})

    useEffect(() => {
        (async () => {
            const snap = await getDocs(collection(firestore, 'workSkill'))
            const map: Record<string, string> = {}
            snap.forEach(docSnap => {
                const d = docSnap.data()
                map[d.skillID] = d.name || ''
            })
            setSkillsMap(map)
        })()
    }, [])

    if (!isLoggedIn) {
        firebaseLogin?.()
        return <div>登入中...</div>
    }

    // --- Skill helpers ---
    function findDocIdBySkillID(skillID: string): string | undefined {
        return skillsSnap?.docs.find(d => (d.data() as WorkSkill).skillID === skillID)?.id
    }
    function findDocIdByMemberId(memberId: string): string | undefined {
        return membersSnap?.docs.find(d => (d.data() as WorkMember).memberId === memberId)?.id
    }

    /**
     * Handle skill submit (add or edit)
     */
    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault()
        const skillID = form.skillID || `skill-${Date.now()}`
        const data: WorkSkill = {
            skillID,
            name: form.name || '',
            category: form.category || '',
            level: Number(form.level) || 1,
            isMandatory: !!form.isMandatory
        }
        if (editingId) {
            const docId = findDocIdBySkillID(editingId)
            if (docId) await updateDoc(doc(skillsRef, docId), data)
            setEditingId(null)
        } else {
            await addDoc(skillsRef, data)
        }
        setForm({})
    }

    /**
     * Handle skill delete
     */
    async function handleDelete(skillID: string): Promise<void> {
        const docId = findDocIdBySkillID(skillID)
        if (docId && window.confirm('確定刪除？')) await deleteDoc(doc(skillsRef, docId))
    }

    /**
     * Add skill to members
     */
    async function handleAddSkillToMembers(skillID: string, memberIds: string[]): Promise<void> {
        await Promise.all(
            memberIds.map((memberId: string) => {
                const docId = findDocIdByMemberId(memberId)
                if (docId) return updateDoc(doc(membersRef, docId), { skills: arrayUnion(skillID) })
                return Promise.resolve()
            })
        )
        setShowAddUser(null)
        setSelectedMembers([])
    }

    const skills: WorkSkill[] = skillsSnap?.docs.map(d => d.data() as WorkSkill) ?? []
    const members: WorkMember[] = membersSnap?.docs.map(d => d.data() as WorkMember) ?? []

    let filteredMembers: WorkMember[] = []
    if (snapshot) {
        filteredMembers = snapshot.docs.map(docSnap => docSnap.data() as WorkMember)
        if (filter.role) filteredMembers = filteredMembers.filter(m => m.role === filter.role)
        if (filter.status) filteredMembers = filteredMembers.filter(m => m.status === filter.status)
        filteredMembers.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1))
    }

    return (
        <div className='min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
            <div className='max-w-3xl mx-auto px-2 py-8'>
                <div className='flex mb-6 border-b border-gray-300 dark:border-gray-700'>
                    <button
                        className={`px-4 py-2 font-bold ${activeTab === TAB_MEMBER ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}
                        onClick={() => setActiveTab(TAB_MEMBER)}
                        type="button"
                    >
                        成員管理
                    </button>
                    <button
                        className={`px-4 py-2 font-bold ml-4 ${activeTab === TAB_SKILL ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}
                        onClick={() => setActiveTab(TAB_SKILL)}
                        type="button"
                    >
                        技能管理
                    </button>
                </div>
                {activeTab === TAB_MEMBER && (
                    <div>
                        <h1 className='text-2xl font-bold mb-4 text-center'>工作人員列表</h1>
                        <div className='flex flex-wrap gap-2 mb-2 items-center justify-center'>
                            <label>角色:
                                <select value={filter.role} onChange={e => setFilter(prev => ({ ...prev, role: e.target.value }))} className='ml-1 border rounded'>
                                    <option value=''>全部</option>
                                    <option value='Developer'>Developer</option>
                                    <option value='Designer'>Designer</option>
                                </select>
                            </label>
                            <label>狀態:
                                <select value={filter.status} onChange={e => setFilter(prev => ({ ...prev, status: e.target.value }))} className='ml-1 border rounded'>
                                    <option value=''>全部</option>
                                    <option value='在職'>在職</option>
                                    <option value='離職'>離職</option>
                                    <option value='暫停合作'>暫停合作</option>
                                    <option value='黑名單'>黑名單</option>
                                </select>
                            </label>
                            <label>排序:
                                <select value={sortKey} onChange={e => setSortKey(e.target.value as 'name' | 'role')} className='ml-1 border rounded'>
                                    <option value='name'>名稱</option>
                                    <option value='role'>角色</option>
                                </select>
                            </label>
                        </div>
                        {errorMembers && <div className='text-red-600'>錯誤：{errorMembers.message}</div>}
                        <div className='flex flex-row flex-wrap gap-4 justify-start items-stretch'>
                            {filteredMembers.map(member => (
                                <div key={member.memberId} className='p-4 bg-card rounded-lg shadow border border-border min-w-[320px] flex-1' style={{ maxWidth: 350 }}>
                                    {editingMember === member.memberId ? (
                                        <div className='flex flex-col gap-2'>
                                            <input type='text' value={updatedFields.name ?? member.name}
                                                onChange={e => setUpdatedFields(prev => ({ ...prev, name: e.target.value }))} placeholder='姓名' className='border p-1 rounded' />
                                            <input type='text' value={updatedFields.role ?? member.role}
                                                onChange={e => setUpdatedFields(prev => ({ ...prev, role: e.target.value }))} placeholder='角色' className='border p-1 rounded' />
                                            <input type='text' value={updatedFields.skills ?? member.skills.map(skillId => skillsMap[skillId] || skillId).join(', ')}
                                                onChange={e => setUpdatedFields(prev => ({ ...prev, skills: e.target.value }))} placeholder='技能(逗號分隔)' className='border p-1 rounded' />
                                            <div className='flex gap-2 mt-2'>
                                                <button
                                                    onClick={async () => {
                                                        const { skills, ...rest } = updatedFields
                                                        const updateData: Partial<WorkMember> = { ...rest }
                                                        if (skills !== undefined) {
                                                            updateData.skills = skills.split(',').map(name => name.trim())
                                                        }
                                                        await updateDoc(doc(firestore, 'workMember', member.memberId), updateData)
                                                        setEditingMember(null)
                                                        setUpdatedFields({})
                                                    }}
                                                    className='bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded'
                                                    type="button"
                                                >
                                                    儲存
                                                </button>
                                                <button onClick={() => { setEditingMember(null); setUpdatedFields({}) }} className='border px-4 py-1 rounded' type="button">
                                                    取消
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='flex flex-col gap-1'>
                                            <div className='font-semibold text-lg'>{member.name}</div>
                                            <div>角色: {member.role}</div>
                                            <div>技能: {member.skills.map(skillId => skillsMap[skillId] || skillId).join(', ')}</div>
                                            <div className='flex gap-2 mt-2'>
                                                <button onClick={() => setEditingMember(member.memberId)} className='text-blue-600 hover:underline' type="button">編輯</button>
                                                <button className='text-red-600 hover:underline' onClick={async () => {
                                                    if (window.confirm('確定要刪除嗎？')) {
                                                        await deleteDoc(doc(firestore, 'workMember', member.memberId))
                                                    }
                                                }} type="button">刪除</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === TAB_SKILL && (
                    <div>
                        <h1 className='text-2xl font-bold mb-4'>技能表</h1>
                        <form onSubmit={handleSubmit} className='mb-4 flex gap-2 flex-wrap'>
                            <input
                                name='name'
                                placeholder='技能名稱'
                                value={form.name || ''}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, name: e.target.value }))}
                                className='border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                required
                            />
                            <input
                                name='category'
                                placeholder='類別'
                                value={form.category || ''}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, category: e.target.value }))}
                                className='border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            />
                            <div className='flex flex-col'>
                                <input
                                    name='level'
                                    type='number'
                                    min={1}
                                    max={10}
                                    title='技能等級 1-10，1為基礎，10為專家'
                                    value={form.level === undefined ? 1 : form.level}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setForm(f => ({
                                            ...f,
                                            level: e.target.value === '' ? undefined : Number(e.target.value)
                                        }))
                                    }
                                    className='border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                />
                                <span className='text-sm text-gray-500 dark:text-gray-400'>技能等級(1-10)</span>
                            </div>
                            <label className='flex items-center space-x-2'>
                                <input
                                    type='checkbox'
                                    checked={!!form.isMandatory}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, isMandatory: e.target.checked }))}
                                    className='dark:bg-gray-700'
                                />
                                <span>必須</span>
                            </label>
                            <button
                                type='submit'
                                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-200'
                            >
                                {editingId ? '儲存' : '新增'}
                            </button>
                            {editingId && (
                                <button
                                    type='button'
                                    onClick={() => {
                                        setForm({})
                                        setEditingId(null)
                                    }}
                                    className='px-4 py-2 rounded border border-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200'
                                >
                                    取消
                                </button>
                            )}
                        </form>
                        <table className='w-full border-collapse mb-8 text-left'>
                            <thead>
                                <tr className='bg-gray-100 dark:bg-gray-700'>
                                    <th className='border border-gray-300 dark:border-gray-600 px-2 py-1'>名稱</th>
                                    <th className='border border-gray-300 dark:border-gray-600 px-2 py-1'>類別</th>
                                    <th className='border border-gray-300 dark:border-gray-600 px-2 py-1'>等級</th>
                                    <th className='border border-gray-300 dark:border-gray-600 px-2 py-1'>必須</th>
                                    <th className='border border-gray-300 dark:border-gray-600 px-2 py-1'>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {skills.map(skill => (
                                    <tr key={skill.skillID} className='odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800'>
                                        <td className='border border-gray-300 dark:border-gray-600 px-2 py-1'>{skill.name}</td>
                                        <td className='border border-gray-300 dark:border-gray-600 px-2 py-1'>{skill.category}</td>
                                        <td className='border border-gray-300 dark:border-gray-600 px-2 py-1'>{skill.level}</td>
                                        <td className='border border-gray-300 dark:border-gray-600 px-2 py-1'>{skill.isMandatory ? '是' : '否'}</td>
                                        <td className='border border-gray-300 dark:border-gray-600 px-2 py-1 space-x-2'>
                                            <button
                                                onClick={() => {
                                                    setForm(skill)
                                                    setEditingId(skill.skillID)
                                                }}
                                                className='text-blue-600 hover:underline'
                                                type="button"
                                            >
                                                編輯
                                            </button>
                                            <button onClick={() => handleDelete(skill.skillID)} className='text-red-600 hover:underline' type="button">
                                                刪除
                                            </button>
                                            <button
                                                onClick={() => setShowAddUser(skill.skillID)}
                                                className='text-green-600 hover:underline'
                                                type="button"
                                            >
                                                加入用戶
                                            </button>
                                            {showAddUser === skill.skillID && (
                                                <div className='bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 mt-2'>
                                                    <select
                                                        multiple
                                                        value={selectedMembers}
                                                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                                            setSelectedMembers(Array.from(e.target.selectedOptions).map(o => o.value))
                                                        }
                                                        className='border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                    >
                                                        {members.map(m => (
                                                            <option key={m.memberId} value={m.memberId}>
                                                                {m.name}（{m.role}）
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className='flex gap-2 mt-2'>
                                                        <button
                                                            onClick={() => handleAddSkillToMembers(skill.skillID, selectedMembers)}
                                                            className='bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded transition-colors duration-200'
                                                            type="button"
                                                        >
                                                            確定
                                                        </button>
                                                        <button
                                                            onClick={() => setShowAddUser(null)}
                                                            className='border border-gray-400 dark:border-gray-600 px-4 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200'
                                                            type="button"
                                                        >
                                                            取消
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {errorSkills && <div className='text-red-600'>讀取錯誤: {String(errorSkills)}</div>}
                    </div>
                )}
            </div>
            <AdminBottomNav />
        </div>
    )
}