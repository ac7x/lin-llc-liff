"use client";
import { WorkMember, updateWorkMember } from "@/app/actions/workmember.action";
import { LiffContext } from "@/modules/line/liff/interfaces/Liff";
import { firestore } from "@/modules/shared/infrastructure/persistence/firebase/clientApp";
import { ManagementBottomNav } from '@/modules/shared/interfaces/navigation/ManagementBottomNav';
import { collection, getDocs } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";

export default function WorkMemberPage() {
  const { isLoggedIn, firebaseLogin } = useContext(LiffContext);
  const [members, setMembers] = useState<WorkMember[]>([]);
  const [filter, setFilter] = useState({ role: "", status: "" });
  const [sortKey, setSortKey] = useState<"name" | "role">("name");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [updatedFields, setUpdatedFields] = useState<{
    name?: string; role?: string; skills?: string; availability?: WorkMember['availability']; status?: WorkMember['status']; email?: string; phone?: string; lineId?: string;
  }>({});

  useEffect(() => {
    (async () => {
      if (!isLoggedIn) await firebaseLogin();
      const snapshot = await getDocs(collection(firestore, "workMember"));
      let data: WorkMember[] = snapshot.docs.map(doc => doc.data() as WorkMember);
      if (filter.role) data = data.filter(m => m.role === filter.role);
      if (filter.status) data = data.filter(m => m.status === filter.status);
      data.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1));
      setMembers(data);
    })();
  }, [filter, sortKey, isLoggedIn, firebaseLogin]);

  return (
    <>
      <main className="pb-16 max-w-lg mx-auto px-4 bg-background text-foreground min-h-screen">
        <h1 className="text-2xl font-bold mb-6 text-center tracking-wide">工作人員列表</h1>
        <div className="mb-4 flex flex-wrap gap-4 items-center justify-center bg-card p-4 rounded-lg shadow">
          <label className="flex items-center gap-2">角色:
            <select value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">全部</option><option value="Developer">Developer</option><option value="Designer">Designer</option>
            </select>
          </label>
          <label className="flex items-center gap-2">狀態:
            <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">全部</option><option value="在職">在職</option><option value="離職">離職</option>
            </select>
          </label>
        </div>
        <div className="mb-4 flex items-center justify-center bg-card p-4 rounded-lg shadow">
          <label className="flex items-center gap-2">排序:
            <select value={sortKey} onChange={e => setSortKey(e.target.value as "name" | "role")} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="name">名稱</option><option value="role">角色</option>
            </select>
          </label>
        </div>
        <ul className="space-y-4">
          {members.map(member => (
            <li key={member.memberId} className="p-6 bg-card text-foreground rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-200">
              {editingMember === member.memberId ? (
                <div className="flex flex-col gap-3">
                  <input type="text" value={updatedFields.name ?? member.name} onChange={e => setUpdatedFields(f => ({ ...f, name: e.target.value }))} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="姓名" />
                  <input type="text" value={updatedFields.role ?? member.role} onChange={e => setUpdatedFields(f => ({ ...f, role: e.target.value }))} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="角色" />
                  <input type="text" value={updatedFields.skills ?? member.skills.join(', ')} onChange={e => setUpdatedFields(f => ({ ...f, skills: e.target.value }))} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="技能 (以逗號分隔)" />
                  <input type="text" value={updatedFields.email ?? member.contactInfo.email ?? ''} onChange={e => setUpdatedFields(f => ({ ...f, email: e.target.value }))} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Email" />
                  <input type="text" value={updatedFields.phone ?? member.contactInfo.phone ?? ''} onChange={e => setUpdatedFields(f => ({ ...f, phone: e.target.value }))} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="電話" />
                  <input type="text" value={updatedFields.lineId ?? member.contactInfo.lineId ?? ''} onChange={e => setUpdatedFields(f => ({ ...f, lineId: e.target.value }))} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Line ID" />
                  <select value={updatedFields.availability ?? member.availability} onChange={e => setUpdatedFields(f => ({ ...f, availability: e.target.value as typeof member.availability }))} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="空閒">空閒</option><option value="忙碌">忙碌</option><option value="請假">請假</option><option value="離線">離線</option>
                  </select>
                  <select value={updatedFields.status ?? member.status} onChange={e => setUpdatedFields(f => ({ ...f, status: e.target.value as typeof member.status }))} className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="在職">在職</option><option value="離職">離職</option><option value="暫停合作">暫停合作</option><option value="黑名單">黑名單</option>
                  </select>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => {
                      const { email, phone, lineId, skills, ...rest } = updatedFields;
                      const updateData: Partial<WorkMember> = { ...rest };
                      if (skills !== undefined) updateData.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
                      if (email !== undefined || phone !== undefined || lineId !== undefined) {
                        updateData.contactInfo = {
                          ...(members.find(m => m.memberId === member.memberId)?.contactInfo || {}),
                          email: email ?? members.find(m => m.memberId === member.memberId)?.contactInfo.email,
                          phone: phone ?? members.find(m => m.memberId === member.memberId)?.contactInfo.phone,
                          lineId: lineId ?? members.find(m => m.memberId === member.memberId)?.contactInfo.lineId,
                        };
                      }
                      updateWorkMember(member.memberId, updateData);
                      setEditingMember(null); setUpdatedFields({});
                    }} className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark transition-colors">儲存</button>
                    <button onClick={() => { setEditingMember(null); setUpdatedFields({}); }} className="bg-muted text-muted-foreground px-4 py-2 rounded shadow hover:bg-muted-dark transition-colors">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold mb-1">{member.name}</h2>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="bg-muted text-muted-foreground px-2 py-1 rounded">角色: {member.role}</span>
                    <span className="bg-muted text-muted-foreground px-2 py-1 rounded">技能: {member.skills.join(", ")}</span>
                    <span className="bg-muted text-muted-foreground px-2 py-1 rounded">狀態: {member.availability}</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 text-sm">
                    <span>聯絡資訊: {member.contactInfo?.phone || member.contactInfo?.email || "無"}</span>
                    <span>身分狀態: {member.status}</span>
                    <span>最後活躍時間: {member.lastActiveTime}</span>
                    <span>電話: {member.contactInfo?.phone || "未提供"}</span>
                  </div>
                  <button onClick={() => setEditingMember(member.memberId)} className="bg-secondary text-secondary-foreground hover:bg-secondary-dark px-4 py-2 rounded mt-3 shadow transition-colors">編輯</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
      <ManagementBottomNav />
    </>
  );
}