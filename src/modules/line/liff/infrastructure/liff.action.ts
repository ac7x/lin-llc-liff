"use server"
import "@/modules/shared/infrastructure/persistence/firebase-admin/adminApp";
import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/adminApp";
import { Auth, getAuth, UserRecord } from "firebase-admin/auth";

class LineLoginError extends Error {
    constructor(message: string, public readonly code?: string) { super(message); this.name = 'LineLoginError' }
}

interface LineProfile { userId: string; displayName: string; pictureUrl?: string }
interface UserProfile { displayName: string; pictureUrl?: string }

function hasCode(error: unknown): error is { code: string } {
    return typeof error === "object" && error !== null && "code" in error && typeof (error as Record<string, unknown>).code === "string";
}

export async function loginWithLine(accessToken: string): Promise<string> {
    try {
        const profile = await fetchLineProfile(accessToken)
        const auth = getAuth()
        await Promise.all([
            updateUserProfile(auth, profile.userId, { displayName: profile.displayName, pictureUrl: profile.pictureUrl }),
            initializeUserData(profile.userId)
        ])
        return auth.createCustomToken(profile.userId)
    } catch (err) {
        if (err instanceof LineLoginError) throw new Error(`LINE 登入錯誤: ${err.message}`)
        throw new Error(`伺服器端錯誤: ${err instanceof Error ? err.message : String(err)}`)
    }
}

async function fetchLineProfile(accessToken: string): Promise<LineProfile> {
    const res = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) throw new LineLoginError("LINE Token 無效", "INVALID_TOKEN")
    return res.json()
}

async function updateUserProfile(auth: Auth, userId: string, profile: UserProfile): Promise<UserRecord> {
    try {
        return await auth.updateUser(userId, { displayName: profile.displayName, photoURL: profile.pictureUrl })
    } catch (err) {
        if (err instanceof Error && hasCode(err) && err.code === "auth/user-not-found") {
            return await auth.createUser({ uid: userId, displayName: profile.displayName, photoURL: profile.pictureUrl })
        }
        throw err
    }
}

async function initializeUserData(userId: string): Promise<void> {
    const batch = firestoreAdmin.batch()
    const assetRef = firestoreAdmin.collection("workAsset").doc(userId)
    const memberRef = firestoreAdmin.collection("workMember").doc(userId)
    batch.set(memberRef, {
        memberId: userId, lastLoginAt: new Date().toISOString(), name: "未指定",
        role: "未指定", skills: [], availability: "空閒", contactInfo: {},
        status: "在職", isActive: true, lastActiveTime: new Date().toISOString()
    }, { merge: true })
    if (!(await assetRef.get()).exists) {
        batch.set(assetRef, { userId, coin: 0, diamond: 0, updatedAt: new Date().toISOString() })
    }
    await batch.commit()
}