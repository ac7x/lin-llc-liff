'use server';

import { getFirestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase/firebase-admin';
import { z } from 'zod';

/**
 * Firebase Admin 測試寫入數據
 */
export async function testFirebaseAdminWrite() {
  try {
    const firestore = getFirestoreAdmin();
    const testCollection = firestore.collection('test');
    const docId = `test-doc-${Date.now()}`;
    await testCollection.doc(docId).set({
      message: 'Test from server side (Firebase Admin SDK)',
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    });
    return { success: true, docId };
  } catch (error) {
    console.error('Firebase Admin write test failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

// 寫入測試數據的輸入驗證結構
const WriteTestInputSchema = z.object({
  message: z.string().min(1).max(100),
});

// 客戶端提交的寫入測試數據操作
export async function testClientSubmittedWrite(data: FormData) {
  try {
    const message = data.get('message') as string;
    
    // 驗證輸入
    const parsedData = WriteTestInputSchema.parse({ message });
    
    const firestore = getFirestoreAdmin();
    const testCollection = firestore.collection('test');
    const docId = `user-submitted-${Date.now()}`;
    
    await testCollection.doc(docId).set({
      message: parsedData.message,
      timestamp: new Date().toISOString(),
      createdAt: new Date()
    });
    
    return { success: true, docId };
  } catch (error) {
    console.error('Firebase client-submitted write test failed:', error);
    return { success: false, error: (error as Error).message };
  }
}
