"use server";
import { WorkMember } from "@/app/actions/members.action";
import "@/modules/shared/infrastructure/persistence/firebase-admin/client";
import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";
import { Auth, getAuth, UserRecord } from "firebase-admin/auth";

// 定義錯誤類別
class LineLoginError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'LineLoginError';
    }
}

// LINE Profile 介面
interface LineProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}

// 使用者資料介面
interface UserProfile {
    displayName: string;
    pictureUrl?: string;
}

export async function loginWithLine(accessToken: string): Promise<string> {
    try {
        const profile = await fetchLineProfile(accessToken);
        const auth = getAuth();

        // 平行處理用戶資料更新和初始化
        await Promise.all([
            updateUserProfile(auth, profile.userId, {
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl
            }),
            initializeUserData(profile.userId)
        ]);

        // 檢查並建立 workMembers 條目
        const workMemberDoc = await firestoreAdmin.collection("workMembers").doc(profile.userId).get();
        if (!workMemberDoc.exists) {
            const newWorkMember: WorkMember = {
                memberId: profile.userId,
                name: profile.displayName,
                role: "未指定",
                skills: [],
                availability: "空閒",
                contactInfo: {},
                status: "在職",
                isActive: true,
                lastActiveTime: new Date().toISOString()
            };
            await firestoreAdmin.collection("workMembers").doc(profile.userId).set(newWorkMember);
        }

        return auth.createCustomToken(profile.userId);
    } catch (err) {
        console.error("登入失敗:", err);
        if (err instanceof LineLoginError) {
            throw new Error(`LINE 登入錯誤: ${err.message}`);
        }
        throw new Error(`伺服器端錯誤: ${err instanceof Error ? err.message : String(err)}`);
    }
}

async function fetchLineProfile(accessToken: string): Promise<LineProfile> {
    const res = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        throw new LineLoginError("LINE Token 無效", "INVALID_TOKEN");
    }

    return res.json();
}

async function updateUserProfile(auth: Auth, userId: string, profile: UserProfile): Promise<UserRecord> {
    try {
        return await auth.updateUser(userId, {
            displayName: profile.displayName,
            photoURL: profile.pictureUrl
        });
    } catch (err) {
        if (err instanceof Error && 'code' in err && err.code === "auth/user-not-found") {
            return await auth.createUser({
                uid: userId,
                displayName: profile.displayName,
                photoURL: profile.pictureUrl
            });
        }
        throw err;
    }
}

async function initializeUserData(userId: string): Promise<void> {
    const batch = firestoreAdmin.batch();
    const userRef = firestoreAdmin.collection("users").doc(userId);
    const assetRef = firestoreAdmin.collection("assets").doc(userId);

    batch.set(userRef, {
        lastLoginAt: new Date().toISOString()
    }, { merge: true });

    const assetSnap = await assetRef.get();
    if (!assetSnap.exists) {
        batch.set(assetRef, {
            userId,
            coin: 0,
            diamond: 0,
            updatedAt: new Date().toISOString()
        });
    }

    await batch.commit();
}
