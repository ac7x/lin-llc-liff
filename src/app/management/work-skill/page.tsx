"use client";
import { firestore } from "@/modules/shared/infrastructure/persistence/firebase/clientApp";
import { addDoc, arrayUnion, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";

// 型別定義
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
  const [skillsSnap] = useCollection(skillsRef);
  const [membersSnap] = useCollection(membersRef);

  const [form, setForm] = useState<Partial<WorkSkill>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  function findDocIdBySkillID(skillID: string) {
    return skillsSnap?.docs.find((d) => (d.data() as WorkSkill).skillID === skillID)?.id;
  }

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

  async function handleDelete(skillID: string) {
    const docId = findDocIdBySkillID(skillID);
    if (docId && window.confirm("確定刪除？")) await deleteDoc(doc(skillsRef, docId));
  }

  const skills: WorkSkill[] = skillsSnap?.docs.map((d) => d.data() as WorkSkill) ?? [];

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">技能表</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap mb-4">
        <input
          placeholder="技能名稱"
          value={form.name || ""}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="border p-2 rounded w-full"
          required
        />
        <input
          placeholder="類別"
          value={form.category || ""}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="border p-2 rounded w-full"
        />
        <input
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
          className="border p-2 rounded w-full"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.isMandatory}
            onChange={(e) => setForm((f) => ({ ...f, isMandatory: e.target.checked }))}
          />
          必須
        </label>
        <textarea
          placeholder="說明"
          value={form.description || ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="border p-2 rounded w-full"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? "儲存" : "新增"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setForm({});
              setEditingId(null);
            }}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            取消
          </button>
        )}
      </form>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">名稱</th>
            <th className="border p-2">類別</th>
            <th className="border p-2">等級</th>
            <th className="border p-2">必須</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.skillID}>
              <td className="border p-2">{skill.name}</td>
              <td className="border p-2">{skill.category}</td>
              <td className="border p-2">{skill.level}</td>
              <td className="border p-2">{skill.isMandatory ? "是" : "否"}</td>
              <td className="border p-2">
                <button
                  onClick={() => {
                    setForm(skill);
                    setEditingId(skill.skillID);
                  }}
                  className="text-blue-500"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDelete(skill.skillID)}
                  className="text-red-500 ml-2"
                >
                  刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}