"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/adminApp";

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

/**
 * 取得所有 WorkMember
 * @returns WorkMember 陣列
 */
export async function getAllWorkMembers(): Promise<WorkMember[]> {
    const snapshot = await firestoreAdmin.collection("workMember").get();
    return snapshot.docs.map(doc => doc.data() as WorkMember);
}

/**
 * 新增 WorkMember 至 Firestore 資料庫
 * @param member WorkMember 物件，包含成員資訊
 * @returns 無回傳值，僅執行新增動作
 */
export async function addWorkMember(member: WorkMember): Promise<void> {
    await firestoreAdmin.collection("workMember").doc(member.memberId).set(member);
}

/**
 * 更新指定 WorkMember 至 Firestore 資料庫
 * @param memberId WorkMember 的唯一識別碼
 * @param updates 欲更新的 WorkMember 欄位內容
 * @returns 無回傳值，僅執行更新動作
 */
export async function updateWorkMember(memberId: string, updates: Partial<WorkMember>): Promise<void> {
    await firestoreAdmin.collection("workMember").doc(memberId).update(updates);
}

/**
 * 從 Firestore 資料庫刪除指定 WorkMember
 * @param memberId WorkMember 的唯一識別碼
 * @returns 無回傳值，僅執行刪除動作
 */
export async function deleteWorkMember(memberId: string): Promise<void> {
    await firestoreAdmin.collection("workMember").doc(memberId).delete();
}
