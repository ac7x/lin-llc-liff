"use server";
import { firestoreAdmin } from "@/modules/shared/infrastructure/persistence/firebase-admin/client";

export async function testFirebaseAdminWrite() {
    try {
        const docRef = firestoreAdmin.collection("testCollection").doc();
        // 強化 log: 寫入前
        console.log("[testFirebaseAdminWrite] 準備寫入 Firestore", { docPath: docRef.path });
        await docRef.set({
            source: "admin",
            timestamp: new Date().toISOString(),
            message: "Hello from firebase-admin!"
        });
        // 強化 log: 寫入成功
        console.log("[testFirebaseAdminWrite] 寫入成功", { docPath: docRef.path });
        return { success: true, message: "firebase-admin 寫入成功" };
    } catch (err) {
        // 強化 log: 寫入失敗
        console.error("[testFirebaseAdminWrite] 寫入失敗", err);
        return { success: false, message: `firebase-admin 寫入失敗: ${err instanceof Error ? err.message : String(err)}` };
    }
}
