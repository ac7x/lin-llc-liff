"use client";
import { WorkMember } from "@/modules/case/workMember/infrastructure/members.action";
import { firestore } from "@/modules/shared/infrastructure/persistence/firebase/client";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function MembersPage() {
  const [members, setMembers] = useState<WorkMember[]>([]);
  const [filter, setFilter] = useState({ role: "", status: "" });
  const [sortKey, setSortKey] = useState<"name" | "role">("name");

  useEffect(() => {
    const fetchMembers = async () => {
      const membersCollection = collection(firestore, "workMember");
      const snapshot = await getDocs(membersCollection);
      let data: WorkMember[] = snapshot.docs.map(doc => doc.data() as WorkMember);

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
  }, [filter, sortKey]);

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">工作人員列表</h1>

        {/* Filter Section */}
        <div className="mb-4">
          <label>
            角色:
            <select
              value={filter.role}
              onChange={e => setFilter({ ...filter, role: e.target.value })}
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
            >
              <option value="">全部</option>
              <option value="在職">在職</option>
              <option value="離職">離職</option>
            </select>
          </label>
        </div>

        {/* Sort Section */}
        <div className="mb-4">
          <label>
            排序:
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as "name" | "role")}
            >
              <option value="name">名稱</option>
              <option value="role">角色</option>
            </select>
          </label>
        </div>

        <ul className="space-y-4">
          {members.map(member => (
            <li key={member.memberId} className="p-4 bg-white rounded shadow">
              <h2 className="text-lg font-semibold">{member.name}</h2>
              <p>角色: {member.role}</p>
              <p>技能: {member.skills.join(", ")}</p>
              <p>狀態: {member.availability}</p>
              <p>聯絡資訊: {member.contactInfo.email || member.contactInfo.phone || "無"}</p>
              <p>身分狀態: {member.status}</p>
              <p>最後活躍時間: {member.lastActiveTime}</p>
              <button className="text-blue-500">編輯</button>
              <button className="text-red-500 ml-2">刪除</button>
            </li>
          ))}
        </ul>
      </main>
      <GlobalBottomNav />
    </>
  );
}
