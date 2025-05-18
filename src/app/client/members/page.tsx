"use client";
import { getAllWorkMembers, WorkMember } from "@/app/actions/members.action";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { useEffect, useState } from "react";

export default function MembersPage() {
  const [members, setMembers] = useState<WorkMember[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const data = await getAllWorkMembers();
      setMembers(data);
    };
    fetchMembers();
  }, []);

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">工作人員列表</h1>
        <ul className="space-y-4">
          {members.map(member => (
            <li key={member.memberId} className="p-4 bg-white rounded shadow">
              <h2 className="text-lg font-semibold">{member.name}</h2>
              <p>角色: {member.role}</p>
              <p>技能: {member.skills.join(", ")}</p>
              <p>狀態: {member.availability}</p>
              <p>聯絡資訊: {member.contactInfo.email || member.contactInfo.phone || "無"}</p>
              <p>身分狀態: {member.status}</p>
            </li>
          ))}
        </ul>
      </main>
      <GlobalBottomNav />
    </>
  );
}
