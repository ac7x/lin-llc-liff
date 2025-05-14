import { LiffUserEntity } from '../../domain/entities/liff-user.entity';
import { LiffUserRepository } from '../../domain/repositories/liff-user-repository.interface';
import { LineUserIdValueObject } from '../../domain/valueObjects/liff-id.value-object';

/**
 * Firebase 實現的 LIFF 用戶儲存庫
 * 使用 Firebase 實現用戶數據的持久化操作
 */
export class LiffUserFirebaseRepository implements LiffUserRepository {
  private readonly collectionName = 'liff_users';
  
  constructor(private readonly firestore: any) {
    if (!firestore) {
      throw new Error('Firestore instance is required');
    }
  }

  /**
   * 通過 LINE User ID 查找 LIFF 用戶
   */
  async findById(id: LineUserIdValueObject): Promise<LiffUserEntity | null> {
    try {
      const docRef = this.firestore.collection(this.collectionName).doc(id.value);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data();
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
      console.error('Error saving user:', error);
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
      console.error('Error updating login status:', error);
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
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
