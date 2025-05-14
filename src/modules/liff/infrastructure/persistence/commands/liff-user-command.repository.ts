import { doc, getDoc, setDoc, updateDoc, deleteDoc, Firestore, collection, query, where, getDocs } from 'firebase/firestore';
import { LiffUserEntity } from '../../../domain/entities/liff-user.entity';
import { LiffUserRepository } from '../../../domain/repositories/liff-user-repository.interface';
import { LineUserIdValueObject } from '../../../domain/valueObjects/liff-id.value-object';
import { getFirestoreClient } from '../../../../shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestoreAdmin } from '../../../../shared/infrastructure/persistence/firebase/firebase-admin';

/**
 * Firebase 客戶端實現的 LIFF 用戶儲存庫
 * 使用前端 Firebase SDK 實現用戶數據的持久化操作
 * 注意：此實現僅適用於客戶端 (瀏覽器環境)
 */
export class LiffUserFirebaseRepository implements LiffUserRepository {
  private readonly collectionName = 'liff_users';
  private readonly firestore: Firestore;
  
  constructor(firestore?: Firestore) {
    // 如果沒有提供 Firestore 實例，則使用默認的客戶端連接
    this.firestore = firestore || getFirestoreClient();
  }

  /**
   * 通過 LINE User ID 查找 LIFF 用戶
   */
  async findById(id: LineUserIdValueObject): Promise<LiffUserEntity | null> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id.value);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const data = snapshot.data();
      return LiffUserEntity.reconstitute({
        id: new LineUserIdValueObject(data.id),
        displayName: data.displayName,
        pictureUrl: data.pictureUrl,
        email: data.email,
        isLoggedIn: data.isLoggedIn,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      });
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  /**
   * 保存 LIFF 用戶
   */
  async save(user: LiffUserEntity): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, user.id);
      await setDoc(docRef, {
        id: user.id,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        email: user.email,
        isLoggedIn: user.isLoggedIn,
        createdAt: user.createdAt,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * 更新 LIFF 用戶登入狀態
   */
  async updateLoginStatus(id: LineUserIdValueObject, isLoggedIn: boolean): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id.value);
      await updateDoc(docRef, {
        isLoggedIn,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating login status:', error);
      throw error;
    }
  }

  /**
   * 刪除 LIFF 用戶
   */
  async delete(id: LineUserIdValueObject): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id.value);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

/**
 * Firebase Admin 實現的 LIFF 用戶儲存庫
 * 使用服務端 Firebase Admin SDK 實現用戶數據的持久化操作
 * 注意：此實現僅適用於伺服器端環境
 */
export class LiffUserAdminRepository implements LiffUserRepository {
  private readonly collectionName = 'liff_users';
  private readonly firestore = getFirestoreAdmin();
  
  /**
   * 通過 LINE User ID 查找 LIFF 用戶
   */
  async findById(id: LineUserIdValueObject): Promise<LiffUserEntity | null> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(id.value);
      const snapshot = await docRef.get();
      
      if (!snapshot.exists) {
        return null;
      }
      
      const data = snapshot.data();
      if (!data) {
        return null;
      }
      
      return LiffUserEntity.reconstitute({
        id: new LineUserIdValueObject(data.id),
        displayName: data.displayName,
        pictureUrl: data.pictureUrl,
        email: data.email,
        isLoggedIn: data.isLoggedIn,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      });
    } catch (error) {
      console.error('Error finding user by id (Admin):', error);
      throw error;
    }
  }

  /**
   * 保存 LIFF 用戶
   */
  async save(user: LiffUserEntity): Promise<void> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(user.id);
      await docRef.set({
        id: user.id,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        email: user.email,
        isLoggedIn: user.isLoggedIn,
        createdAt: user.createdAt,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user (Admin):', error);
      throw error;
    }
  }

  /**
   * 更新 LIFF 用戶登入狀態
   */
  async updateLoginStatus(id: LineUserIdValueObject, isLoggedIn: boolean): Promise<void> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(id.value);
      await docRef.update({
        isLoggedIn,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating login status (Admin):', error);
      throw error;
    }
  }

  /**
   * 刪除 LIFF 用戶
   */
  async delete(id: LineUserIdValueObject): Promise<void> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(id.value);
      await docRef.delete();
    } catch (error) {
      console.error('Error deleting user (Admin):', error);
      throw error;
    }
  }
}
