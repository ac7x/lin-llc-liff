'use client';
import { firestore } from '@/modules/shared/infrastructure/persistence/firebase/clientApp';
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import React, { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

// 型別
type WorkSkill = {
  skillID: string;
  name: string;
  category: string;
  level: number;
  isMandatory: boolean;
};
type WorkMember = {
  memberId: string;
  name: string;
  role: string;
  skills: string[];
};

export default function AdminWorkSkillPage() {
  const skillsRef = collection(firestore, 'workSkill');
  const membersRef = collection(firestore, 'workMember');
  const [skillsSnap, , errorSkills] = useCollection(skillsRef);
  const [membersSnap] = useCollection(membersRef);

  const [form, setForm] = useState<Partial<WorkSkill>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // --- 工具函式用類型斷言解決 unknown 問題 ---
  function findDocIdBySkillID(skillID: string) {
    return skillsSnap?.docs.find((d) => (d.data() as WorkSkill).skillID === skillID)?.id;
  }
  function findDocIdByMemberId(memberId: string) {
    return membersSnap?.docs.find((d) => (d.data() as WorkMember).memberId === memberId)?.id;
  }

  // 新增/編輯
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const skillID = form.skillID || `skill-${Date.now()}`;
    const data: WorkSkill = {
      skillID,
      name: form.name || '',
      category: form.category || '',
      level: Number(form.level) || 1,
      isMandatory: !!form.isMandatory,
    };
    if (editingId) {
      const docId = findDocIdBySkillID(editingId);
      if (docId) await updateDoc(doc(skillsRef, docId), data);
      setEditingId(null);
    } else {
      await addDoc(skillsRef, data);
    }
    setForm({});
  }

  // 刪除
  async function handleDelete(skillID: string) {
    const docId = findDocIdBySkillID(skillID);
    if (docId && window.confirm('確定刪除？')) await deleteDoc(doc(skillsRef, docId));
  }

  // 加入用戶
  async function handleAddSkillToMembers(skillID: string, memberIds: string[]) {
    await Promise.all(
      memberIds.map((memberId) => {
        const docId = findDocIdByMemberId(memberId);
        if (docId) return updateDoc(doc(membersRef, docId), { skills: arrayUnion(skillID) });
        return Promise.resolve();
      })
    );
    setShowAddUser(null);
    setSelectedMembers([]);
  }

  // 資料轉型
  const skills: WorkSkill[] = skillsSnap?.docs.map((d) => d.data() as WorkSkill) ?? [];
  const members: WorkMember[] = membersSnap?.docs.map((d) => d.data() as WorkMember) ?? [];

  return (
    <div className="p-8 max-w-3xl mx-auto text-gray-900 bg-white dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">技能表</h1>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2 flex-wrap">
        <input
          name="name"
          placeholder="技能名稱"
          value={form.name || ''}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          required
        />
        <input
          name="category"
          placeholder="類別"
          value={form.category || ''}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <div className="flex flex-col">
          <input
            name="level"
            type="number"
            min={1}
            max={10}
            title="技能等級 1-10，1為基礎，10為專家"
            value={form.level === undefined ? 1 : form.level}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                level: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
            className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">技能等級(1-10)</span>
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={!!form.isMandatory}
            onChange={(e) => setForm((f) => ({ ...f, isMandatory: e.target.checked }))}
            className="dark:bg-gray-700"
          />
          <span>必須</span>
        </label>
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-200"
        >
          {editingId ? '儲存' : '新增'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setForm({});
              setEditingId(null);
            }}
            className="px-4 py-2 rounded border border-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            取消
          </button>
        )}
      </form>
      <table className="w-full border-collapse mb-8 text-left">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">名稱</th>
            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">類別</th>
            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">等級</th>
            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">必須</th>
            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">操作</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.skillID} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
              <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{skill.name}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{skill.category}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{skill.level}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{skill.isMandatory ? '是' : '否'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 space-x-2">
                <button
                  onClick={() => {
                    setForm(skill);
                    setEditingId(skill.skillID);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  編輯
                </button>
                <button onClick={() => handleDelete(skill.skillID)} className="text-red-600 hover:underline">
                  刪除
                </button>
                <button
                  onClick={() => setShowAddUser(skill.skillID)}
                  className="text-green-600 hover:underline"
                >
                  加入用戶
                </button>
                {showAddUser === skill.skillID && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 mt-2">
                    <select
                      multiple
                      value={selectedMembers}
                      onChange={(e) =>
                        setSelectedMembers(Array.from(e.target.selectedOptions).map((o) => o.value))
                      }
                      className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {members.map((m) => (
                        <option key={m.memberId} value={m.memberId}>
                          {m.name}（{m.role}）
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddSkillToMembers(skill.skillID, selectedMembers)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded transition-colors duration-200"
                      >
                        確定
                      </button>
                      <button
                        onClick={() => setShowAddUser(null)}
                        className="border border-gray-400 dark:border-gray-600 px-4 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
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
      {errorSkills && <div className="text-red-600">讀取錯誤: {String(errorSkills)}</div>}
      <ManagementBottomNav />
    </div>
  );
}