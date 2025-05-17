"use server";
import "@/modules/shared/infrastructure/persistence/firebase-admin/client";

import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";
import { getAuth } from "firebase-admin/auth";

export async function loginWithLine(accessToken: string): Promise<string> {
    try {
        // 1. 呼叫 Line Profile API
        const profileRes = await fetch("https://api.line.me/v2/profile", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!profileRes.ok) throw new Error("Line accessToken 無效");
        const profile = await profileRes.json();
        const { userId, displayName, pictureUrl } = profile;

        // 2. 用 userId 產生 Firebase custom token
        const auth = getAuth();
        // 可根據需求同步 user profile 到 Firebase
        await auth.updateUser(userId, {
            displayName,
            photoURL: pictureUrl,
        }).catch(async (err) => {
            if (err.code === "auth/user-not-found") {
                await auth.createUser({
                    uid: userId,
                    displayName,
                    photoURL: pictureUrl,
                });
            } else {
                throw err;
            }
        });
        // 新增：記錄登入時間到 Firestore
        console.log("[loginWithLine] 準備寫入 Firestore", { userId });
        await firestoreAdmin.collection("users").doc(userId).set({
            lastLoginAt: new Date().toISOString()
        }, { merge: true });
        console.log("[loginWithLine] Firestore 寫入成功", { userId });

        // 新增：初始化 assets 集合（若不存在）
        const assetRef = firestoreAdmin.collection("assets").doc(userId);
        const assetSnap = await assetRef.get();
        if (!assetSnap.exists) {
            await assetRef.set({
                userId,
                coin: 0,
                diamond: 0,
                updatedAt: new Date().toISOString()
            });
            console.log("[loginWithLine] Assets 初始化成功", { userId });
        }
        const customToken = await auth.createCustomToken(userId);

        // 3. 回傳 custom token
        return customToken;
    } catch (err) {
        console.error("loginWithLine error:", err);
        throw new Error("loginWithLine 伺服器端錯誤: " + (err instanceof Error ? err.message : String(err)));
    }
}
