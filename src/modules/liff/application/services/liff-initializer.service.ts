import { LiffUserEntity } from '../../domain/entities/liff-user.entity';
import { LiffUserRepository } from '../../domain/repositories/liff-user-repository.interface';
import { LineUserIdValueObject } from '../../domain/valueObjects/liff-id.value-object';
import { LiffConfigDto } from '../../infrastructure/dtos/liff-profile.dto';
import { LiffProfileMapper } from '../../infrastructure/mappers/liff-profile.mapper';
import { LiffSdkService } from '../../infrastructure/services/liff-sdk.service';

/**
 * LIFF 初始化服務
 * 處理 LIFF SDK 初始化、用戶登入、獲取資料等流程
 */
export class LiffInitializerService {
  constructor(
    private readonly liffSdkService: LiffSdkService,
    private readonly userRepository: LiffUserRepository
  ) {}
  
  /**
   * 初始化 LIFF SDK
   */
  async initialize(config: LiffConfigDto): Promise<boolean> {
    try {
      const success = await this.liffSdkService.initialize(config);
      if (success && this.liffSdkService.isLoggedIn()) {
        await this.fetchAndSaveUserProfile();
      }
      return success;
    } catch (error) {
      console.error('Error during LIFF initialization:', error);
      return false;
    }
  }
  
  /**
   * 處理用戶登入
   */
  async handleLogin(): Promise<LiffUserEntity | null> {
    try {
      if (!this.liffSdkService.isLoggedIn()) {
        await this.liffSdkService.login();
      }
      
      return await this.fetchAndSaveUserProfile();
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  }
  
  /**
   * 處理用戶登出
   */
  async handleLogout(): Promise<boolean> {
    try {
      if (this.liffSdkService.isLoggedIn()) {
        await this.liffSdkService.logout();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }
  
  /**
   * 獲取用戶狀態
   */
  getLoginStatus(): boolean {
    return this.liffSdkService.isLoggedIn();
  }
  
  /**
   * 獲取並保存用戶資料
   */
  private async fetchAndSaveUserProfile(): Promise<LiffUserEntity | null> {
    try {
      const profileDto = await this.liffSdkService.getProfile();
      const userEntity = LiffProfileMapper.toDomain(profileDto);
      
      await this.userRepository.save(userEntity);
      
      return userEntity;
    } catch (error) {
      console.error('Error fetching and saving user profile:', error);
      return null;
    }
  }
  
  /**
   * 根據 ID 獲取用戶資料
   */
  async getUserById(userId: string): Promise<LiffUserEntity | null> {
    try {
      const lineUserId = new LineUserIdValueObject(userId);
      return await this.userRepository.findById(lineUserId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}
