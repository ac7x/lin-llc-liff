'use server'

import { writeData } from "@/modules/shared/infrastructure/persistence/firebase/firebase-admin";

/**
 * 測試 Firebase Admin 寫入功能的 Server Action
 * @returns 寫入結果
 */
export async function testFirebaseWrite() {
    try {
        const testData = {
            timestamp: new Date().toISOString(),
            message: "This is a test write operation",
            success: true
        };

        // 生成一個唯一ID作為文件ID
        const docId = `test-${Date.now()}`;

        // 測試寫入到 "test-data" 集合
        await writeData('test-data', docId, testData);

        return { success: true, docId, message: `成功寫入測試數據 ID: ${docId}` };
    } catch (error) {
        console.error('Firebase 寫入測試失敗:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            message: '寫入測試失敗，請查看控制台'
        };
    }
}
