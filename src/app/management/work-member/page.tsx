"use client";
import { LiffContext } from "@/modules/line/liff/interfaces/Liff";
import { firestore } from "@/modules/shared/infrastructure/persistence/firebase/clientApp";
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import { collection, deleteDoc, doc, getDocs, query, updateDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";

export interface WorkMember {
  memberId: string;
  name: string;
  role: string;
  skills: string[];
  availability: "空閒" | "忙碌" | "請假" | "離線";
  assignedEpicIDs?: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    lineId?: string;
  };
  status: "在職" | "離職" | "暫停合作" | "黑名單";
  isActive: boolean;
  lastActiveTime: string;
}

type UpdatedFields = {
  name?: string;
  role?: string;
  skills?: string;
  availability?: WorkMember['availability'];
  status?: WorkMember['status'];
  email?: string;
  phone?: string;
  lineId?: string;
};

export default function WorkMemberPage() {
  const { isLoggedIn, firebaseLogin } = useContext(LiffContext);
  const workMemberCol = collection(firestore, "workMember");
  const [snapshot, , error] = useCollection(query(workMemberCol));
  const [filter, setFilter] = useState({ role: "", status: "" });
  const [sortKey, setSortKey] = useState<"name" | "role">("name");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [updatedFields, setUpdatedFields] = useState<UpdatedFields>({});
  const [skillsMap, setSkillsMap] = useState<Record<string, string>>({});

  // 載入所有技能 (id -> name)
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(firestore, "workSkill"));
      const map: Record<string, string> = {};
      snap.forEach(docSnap => {
        const d = docSnap.data();
        map[docSnap.id] = d.name || "";
      });
      setSkillsMap(map);
    })();
  }, []);

  if (!isLoggedIn) {
    firebaseLogin?.();
    return <div>登入中...</div>;
  }

  let members: WorkMember[] = [];
  if (snapshot) {
    members = snapshot.docs.map(docSnap => docSnap.data() as WorkMember);
    if (filter.role) members = members.filter(m => m.role === filter.role);
    if (filter.status) members = members.filter(m => m.status === filter.status);
    members.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1));
  }

  return (
    <>
      <main className="pb-16 max-w-full mx-auto px-2 bg-background text-foreground min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-center">工作人員列表</h1>
        <div className="flex flex-wrap gap-2 mb-2 items-center justify-center">
          <label>角色:
            <select value={filter.role} onChange={e => setFilter(prev => ({ ...prev, role: e.target.value }))}>
              <option value="">全部</option>
              <option value="Developer">Developer</option>
              <option value="Designer">Designer</option>
            </select>
          </label>
          <label>狀態:
            <select value={filter.status} onChange={e => setFilter(prev => ({ ...prev, status: e.target.value }))}>
              <option value="">全部</option>
              <option value="在職">在職</option>
              <option value="離職">離職</option>
              <option value="暫停合作">暫停合作</option>
              <option value="黑名單">黑名單</option>
            </select>
          </label>
          <label>排序:
            <select value={sortKey} onChange={e => setSortKey(e.target.value as "name" | "role")}>
              <option value="name">名稱</option>
              <option value="role">角色</option>
            </select>
          </label>
        </div>
        {error && <div className="text-red-600">錯誤：{error.message}</div>}

        <div className="flex flex-row flex-wrap gap-4 justify-start items-stretch">
          {members.map(member => (
            <div key={member.memberId} className="p-4 bg-card rounded-lg shadow border border-border min-w-[320px] flex-1" style={{ maxWidth: 350 }}>
              {editingMember === member.memberId ? (
                <div className="flex flex-col gap-2">
                  <input type="text" value={updatedFields.name ?? member.name}
                    onChange={e => setUpdatedFields(prev => ({ ...prev, name: e.target.value }))} placeholder="姓名" />
                  <input type="text" value={updatedFields.role ?? member.role}
                    onChange={e => setUpdatedFields(prev => ({ ...prev, role: e.target.value }))} placeholder="角色" />
                  <input type="text" value={updatedFields.skills ?? member.skills.map(skillId => skillsMap[skillId] || skillId).join(", ")}
                    onChange={e => setUpdatedFields(prev => ({ ...prev, skills: e.target.value }))} placeholder="技能(逗號分隔)" />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={async () => {
                        const { skills, ...rest } = updatedFields;
                        const updateData: Partial<WorkMember> = { ...rest };
                        if (skills !== undefined) {
                          updateData.skills = skills.split(',').map(name => skillsMap[name.trim()] || name.trim());
                        }
                        await updateDoc(doc(firestore, "workMember", member.memberId), updateData);
                        setEditingMember(null); setUpdatedFields({});
                      }}>儲存</button>
                    <button onClick={() => { setEditingMember(null); setUpdatedFields({}); }}>取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="font-semibold text-lg">{member.name}</div>
                  <div>角色: {member.role}</div>
                  <div>技能: {member.skills
                    .map(skillId => skillsMap[skillId] || skillId)
                    .join(", ")}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setEditingMember(member.memberId)}>編輯</button>
                    <button className="text-red-600" onClick={async () => {
                      if (window.confirm("確定要刪除嗎？")) {
                        await deleteDoc(doc(firestore, "workMember", member.memberId));
                      }
                    }}>刪除</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <ManagementBottomNav />
    </>
  );
}