"use server";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

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

export async function getAllWorkMembers(): Promise<WorkMember[]> {
    const snapshot = await firestoreAdmin.collection("workMember").get();
    return snapshot.docs.map(doc => doc.data() as WorkMember);
}

export async function addWorkMember(member: WorkMember): Promise<void> {
    await firestoreAdmin.collection("workMember").doc(member.memberId).set(member);
}

export async function updateWorkMember(memberId: string, updates: Partial<WorkMember>): Promise<void> {
    await firestoreAdmin.collection("workMember").doc(memberId).update(updates);
}

export async function deleteWorkMember(memberId: string): Promise<void> {
    await firestoreAdmin.collection("workMember").doc(memberId).delete();
}