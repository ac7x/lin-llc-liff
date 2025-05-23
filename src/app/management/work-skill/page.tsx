"use client";
import { firestore } from "@/modules/shared/infrastructure/persistence/firebase/clientApp";
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc, doc, updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";

// 型別
type WorkSkill = {
  skillID: string;
  name: string;
  description: string;
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
  const skillsRef = collection(firestore, "workSkill");
  const membersRef = collection(firestore, "workMember");
  const [skillsSnap, loadingSkills, errorSkills] = useCollection(skillsRef);
  const [membersSnap, loadingMembers] = useCollection(membersRef);

  const [form, setForm] = useState<Partial<WorkSkill>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // --- 工具函式用類型斷言解決 unknown 問題 ---
  function findDocIdBySkillID(skillID: string) {
    return skillsSnap?.docs.find(
      (d) => (d.data() as WorkSkill).skillID === skillID
    )?.id;
  }
  function findDocIdByMemberId(memberId: string) {
    return membersSnap?.docs.find(
      (d) => (d.data() as WorkMember).memberId === memberId
    )?.id;
  }

  // 新增/編輯
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const skillID = form.skillID || `skill-${Date.now()}`;
    const data: WorkSkill = {
      skillID,
      name: form.name || "",
      description: form.description || "",
      category: form.category || "",
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
    if (docId && window.confirm("確定刪除？")) await deleteDoc(doc(skillsRef, docId));
  }

  // 加入用戶
  async function handleAddSkillToMembers(skillID: string, memberIds: string[]) {
    await Promise.all(
      memberIds.map((memberId) => {
        const docId = findDocIdByMemberId(memberId);
        if (docId) return updateDoc(doc(membersRef, docId), { skills: arrayUnion(skillID) });
      })
    );
    setShowAddUser(null);
    setSelectedMembers([]);
  }

  // 資料轉型
  const skills: WorkSkill[] = skillsSnap?.docs.map((d) => d.data() as WorkSkill) ?? [];
  const members: WorkMember[] = membersSnap?.docs.map((d) => d.data() as WorkMember) ?? [];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">技能表 (client+firebase hook)</h1>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2 flex-wrap">
        <input
          name="name"
          placeholder="技能名稱"
          value={form.name || ""}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="border p-2 rounded"
          required
        />
        <input
          name="category"
          placeholder="類別"
          value={form.category || ""}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="border p-2 rounded"
        />
        <input
          name="level"
          type="number"
          min={1}
          max={10}
          value={form.level === undefined ? 1 : form.level}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              level: e.target.value === "" ? undefined : Number(e.target.value),
            }))
          }
          className="border p-2 rounded"
        />
        <label>
          <input
            type="checkbox"
            checked={!!form.isMandatory}
            onChange={(e) => setForm((f) => ({ ...f, isMandatory: e.target.checked }))}
          />
          必須
        </label>
        <input
          name="description"
          placeholder="說明"
          value={form.description || ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
          {editingId ? "儲存" : "新增"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setForm({});
              setEditingId(null);
            }}
          >
            取消
          </button>
        )}
      </form>
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th>名稱</th>
            <th>類別</th>
            <th>等級</th>
            <th>必須</th>
            <th>說明</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.skillID}>
              <td>{skill.name}</td>
              <td>{skill.category}</td>
              <td>{skill.level}</td>
              <td>{skill.isMandatory ? "是" : "否"}</td>
              <td>{skill.description}</td>
              <td>
                <button onClick={() => { setForm(skill); setEditingId(skill.skillID); }}>編輯</button>
                <button onClick={() => handleDelete(skill.skillID)}>刪除</button>
                <button onClick={() => setShowAddUser(skill.skillID)}>加入用戶</button>
                {showAddUser === skill.skillID && (
                  <div className="bg-white border rounded p-2 mt-2">
                    <select
                      multiple
                      value={selectedMembers}
                      onChange={e => setSelectedMembers(Array.from(e.target.selectedOptions).map(o => o.value))}
                      className="border p-1 rounded w-full"
                    >
                      {members.map((m) => (
                        <option key={m.memberId} value={m.memberId}>
                          {m.name}（{m.role}）
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleAddSkillToMembers(skill.skillID, selectedMembers)}>
                        確定
                      </button>
                      <button onClick={() => setShowAddUser(null)}>取消</button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(loadingSkills || loadingMembers) && <div>載入中...</div>}
      {errorSkills && <div>讀取錯誤: {String(errorSkills)}</div>}
      <ManagementBottomNav />
    </div>
  );
}