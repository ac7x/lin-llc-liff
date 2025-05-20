"use client"
import { getAllWorkMembers, updateWorkMember, WorkMember } from '@/app/actions/workmember.action'
import { addWorkSkill, deleteWorkSkill, getAllWorkSkills, updateWorkSkill, WorkSkill } from '@/app/actions/workskill.action'
import React, { useEffect, useState } from 'react'

const AdminWorkSkillPage: React.FC = () => {
  const [skills, setSkills] = useState<WorkSkill[]>([])
  const [members, setMembers] = useState<WorkMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<WorkSkill>>({})
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [skills, members] = await Promise.all([
        getAllWorkSkills(),
        getAllWorkMembers()
      ])
      setSkills(skills)
      setMembers(members)
    } catch {
      setError('載入失敗')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(o => o.value)
    setSelectedMembers(options)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const skillID = form.skillID || `skill-${Date.now()}`
      const newSkill: WorkSkill = {
        skillID,
        name: form.name || '',
        description: form.description || '',
        category: form.category || '',
        level: Number(form.level) || 1,
        isMandatory: !!form.isMandatory
      }
      if (editingSkillId) {
        await updateWorkSkill(editingSkillId, newSkill)
      } else {
        await addWorkSkill(newSkill)
        if (selectedMembers.length > 0) {
          await Promise.all(selectedMembers.map(async memberId => {
            const member = members.find(m => m.memberId === memberId)
            if (member) {
              const newSkills = Array.from(new Set([...(member.skills || []), skillID]))
              await updateWorkMember(memberId, { skills: newSkills })
            }
          }))
        }
      }
      setForm({})
      setSelectedMembers([])
      setEditingSkillId(null)
      await fetchData()
    } catch {
      setError('儲存失敗')
    }
    setLoading(false)
  }

  const handleEdit = (skill: WorkSkill) => {
    setForm(skill)
    setEditingSkillId(skill.skillID)
  }

  const handleDelete = async (skillID: string) => {
    if (!window.confirm('確定要刪除這個技能嗎？')) return
    setLoading(true)
    try {
      await deleteWorkSkill(skillID)
      await fetchData()
    } catch {
      setError('刪除失敗')
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">技能表</h1>
      <p className="text-gray-700 mb-4">這裡可以管理與檢視所有技能資料。</p>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form className="mb-6 space-y-2" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input name="name" value={form.name || ''} onChange={handleInput} placeholder="技能名稱" className="border p-2 rounded flex-1" required />
          <input name="category" value={form.category || ''} onChange={handleInput} placeholder="類別" className="border p-2 rounded w-32" />
          <input name="level" type="number" min={1} max={10} value={form.level || 1} onChange={handleInput} placeholder="等級" className="border p-2 rounded w-20" />
          <label className="flex items-center gap-1">
            <input name="isMandatory" type="checkbox" checked={!!form.isMandatory} onChange={handleInput} />必須
          </label>
        </div>
        <textarea name="description" value={form.description || ''} onChange={handleInput} placeholder="說明" className="border p-2 rounded w-full" />
        <div>
          <label>將此技能加入用戶：</label>
          <select multiple value={selectedMembers} onChange={handleMemberSelect} className="border p-2 rounded w-full max-h-32">
            {members.map(m => <option key={m.memberId} value={m.memberId}>{m.name}（{m.role}）</option>)}
          </select>
        </div>
        <div className="flex gap-2 mt-2">
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded shadow" disabled={loading}>{editingSkillId ? '儲存編輯' : '建立'}</button>
          {editingSkillId && <button type="button" className="bg-muted text-muted-foreground px-4 py-2 rounded" onClick={() => { setForm({}); setEditingSkillId(null); setSelectedMembers([]) }}>取消</button>}
        </div>
      </form>
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">名稱</th>
            <th className="border px-2 py-1">類別</th>
            <th className="border px-2 py-1">等級</th>
            <th className="border px-2 py-1">必須</th>
            <th className="border px-2 py-1">說明</th>
            <th className="border px-2 py-1">操作</th>
          </tr>
        </thead>
        <tbody>
          {skills.map(skill => (
            <tr key={skill.skillID}>
              <td className="border px-2 py-1">{skill.name}</td>
              <td className="border px-2 py-1">{skill.category}</td>
              <td className="border px-2 py-1">{skill.level}</td>
              <td className="border px-2 py-1">{skill.isMandatory ? '是' : '否'}</td>
              <td className="border px-2 py-1">{skill.description}</td>
              <td className="border px-2 py-1">
                <button className="text-blue-600 mr-2" onClick={() => handleEdit(skill)}>編輯</button>
                <button className="text-red-600" onClick={() => handleDelete(skill.skillID)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminWorkSkillPage
