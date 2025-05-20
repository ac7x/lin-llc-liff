"use client";
import { WorkMember, updateWorkMember } from "@/app/actions/workmember.action";
import { LiffContext } from "@/modules/line/liff/interfaces/Liff";
import { firestore } from "@/modules/shared/infrastructure/persistence/firebase/client";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { collection, getDocs } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";

export default function WorkMemberPage() {
  const { isLoggedIn, firebaseLogin } = useContext(LiffContext);
  const [members, setMembers] = useState<WorkMember[]>([]);
  const [filter, setFilter] = useState({ role: "", status: "" });
  const [sortKey, setSortKey] = useState<"name" | "role">("name");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [updatedFields, setUpdatedFields] = useState<{ name?: string }>({});

  useEffect(() => {
    const fetchMembers = async () => {
      if (!isLoggedIn) {
        await firebaseLogin();
      }

      const membersCollection = collection(firestore, "workMember");
      const snapshot = await getDocs(membersCollection);
      let data: WorkMember[] = snapshot.docs.map(doc => doc.data() as WorkMember);
      console.log("獲取的工作人員資料:", data);

      if (filter.role) {
        data = data.filter((member: WorkMember) => member.role === filter.role);
      }
      if (filter.status) {
        data = data.filter((member: WorkMember) => member.status === filter.status);
      }

      data.sort((a: WorkMember, b: WorkMember) => (a[sortKey] > b[sortKey] ? 1 : -1));
      setMembers(data);
    };

    fetchMembers();
  }, [filter, sortKey, isLoggedIn, firebaseLogin]);

  const handleEdit = (memberId: string, field: keyof typeof updatedFields, value: string) => {
    setEditingMember(memberId);
    setUpdatedFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (memberId: string) => {
    if (editingMember) {
      await updateWorkMember(memberId, updatedFields);
      setEditingMember(null);
      setUpdatedFields({});
    }
  };

  return (
    <>
      <main className="pb-16 max-w-lg mx-auto px-4 bg-background text-foreground min-h-screen">
        <h1 className="text-2xl font-bold mb-6 text-center tracking-wide">工作人員列表</h1>

        {/* Filter Section */}
        <div className="mb-4 flex flex-wrap gap-4 items-center justify-center bg-card p-4 rounded-lg shadow">
          <label className="flex items-center gap-2">
            角色:
            <select
              value={filter.role}
              onChange={e => setFilter({ ...filter, role: e.target.value })}
              className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">全部</option>
              <option value="Developer">Developer</option>
              <option value="Designer">Designer</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            狀態:
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">全部</option>
              <option value="在職">在職</option>
              <option value="離職">離職</option>
            </select>
          </label>
        </div>

        {/* Sort Section */}
        <div className="mb-4 flex items-center justify-center bg-card p-4 rounded-lg shadow">
          <label className="flex items-center gap-2">
            排序:
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as "name" | "role")}
              className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="name">名稱</option>
              <option value="role">角色</option>
            </select>
          </label>
        </div>

        <ul className="space-y-4">
          {members.map(member => (
            <li
              key={member.memberId}
              className="p-6 bg-card text-foreground rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-200"
            >
              {editingMember === member.memberId ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={updatedFields.name || member.name}
                    onChange={e => handleEdit(member.memberId, "name", e.target.value)}
                    className="border border-border bg-background text-foreground p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => handleSave(member.memberId)}
                    className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark transition-colors"
                  >
                    儲存
                  </button>
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
                  <button
                    onClick={() => setEditingMember(member.memberId)}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary-dark px-4 py-2 rounded mt-3 shadow transition-colors"
                  >
                    編輯
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
      <GlobalBottomNav />
    </>
  );
}
