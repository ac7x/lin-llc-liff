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
        await firebaseLogin(); // 確保使用者已登入 Firebase
      }

      const membersCollection = collection(firestore, "workMember");
      const snapshot = await getDocs(membersCollection);
      let data: WorkMember[] = snapshot.docs.map(doc => doc.data() as WorkMember);
      console.log("獲取的工作人員資料:", data);

      // Apply filter
      if (filter.role) {
        data = data.filter((member: WorkMember) => member.role === filter.role);
      }
      if (filter.status) {
        data = data.filter((member: WorkMember) => member.status === filter.status);
      }

      // Apply sorting
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
      <main className="pb-16 max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">工作人員列表</h1>

        {/* Filter Section */}
        <div className="mb-4 flex flex-wrap gap-4 items-center justify-center">
          <label>
            角色:
            <select
              value={filter.role}
              onChange={e => setFilter({ ...filter, role: e.target.value })}
              className="border p-2 ml-2 rounded"
            >
              <option value="">全部</option>
              <option value="Developer">Developer</option>
              <option value="Designer">Designer</option>
            </select>
          </label>
          <label>
            狀態:
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className="border p-2 ml-2 rounded"
            >
              <option value="">全部</option>
              <option value="在職">在職</option>
              <option value="離職">離職</option>
            </select>
          </label>
        </div>

        {/* Sort Section */}
        <div className="mb-4 flex items-center justify-center">
          <label>
            排序:
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as "name" | "role")}
              className="border p-2 ml-2 rounded"
            >
              <option value="name">名稱</option>
              <option value="role">角色</option>
            </select>
          </label>
        </div>

        <ul className="space-y-4">
          {members.map(member => (
            <li key={member.memberId} className="p-4 bg-white rounded-lg shadow-md">
              {editingMember === member.memberId ? (
                <>
                  <input
                    type="text"
                    value={updatedFields.name || member.name}
                    onChange={e => handleEdit(member.memberId, "name", e.target.value)}
                    className="border p-2 mb-2 w-full rounded"
                  />
                  <button onClick={() => handleSave(member.memberId)} className="bg-blue-500 text-white px-4 py-2 rounded">儲存</button>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-1">{member.name}</h2>
                  <p>角色: {member.role}</p>
                  <p>技能: {member.skills.join(", ")}</p>
                  <p>狀態: {member.availability}</p>
                  <p>聯絡資訊: {member.contactInfo?.phone || member.contactInfo?.email || "無"}</p>
                  <p>身分狀態: {member.status}</p>
                  <p>最後活躍時間: {member.lastActiveTime}</p>
                  <p>電話: {member.contactInfo?.phone || "未提供"}</p>
                  <button onClick={() => setEditingMember(member.memberId)} className="bg-gray-500 text-white px-4 py-2 rounded mt-2">編輯</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
      <GlobalBottomNav />
    </>
  );
}
