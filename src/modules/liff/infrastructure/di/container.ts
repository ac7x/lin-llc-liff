import { getFirestore } from 'firebase/firestore';
import { LiffInitializerService } from '../../application/services/liff-initializer.service';
import { LiffUserFirebaseRepository } from '../repositories/liff-user-firebase-repository';
import { LiffSdkService } from '../services/liff-sdk.service';

/**
 * 依賴注入容器
 * 管理模組內的依賴關係與實例創建
 */

type ServiceTypes = {
  LiffSdkService: LiffSdkService;
  LiffUserRepository: LiffUserFirebaseRepository;
  LiffInitializerService: LiffInitializerService;
};

// 服務實例緩存
const instances: Partial<ServiceTypes> = {};

/**
 * 初始化依賴注入容器
 */
export function initializeContainer(firebaseApp: any): void {
  const firestore = getFirestore(firebaseApp);
  
  // 創建 LiffSdkService
  const liffSdkService = new LiffSdkService();
  instances.LiffSdkService = liffSdkService;
  
  // 創建 LiffUserRepository
  const userRepository = new LiffUserFirebaseRepository(firestore);
  instances.LiffUserRepository = userRepository;
  
  // 創建 LiffInitializerService
  const liffInitializer = new LiffInitializerService(
    liffSdkService,
    userRepository
  );
  instances.LiffInitializerService = liffInitializer;
}

/**
 * 獲取服務實例
 */
export function createInstance<T>(serviceName: keyof ServiceTypes): T {
  const instance = instances[serviceName];
  
  if (!instance) {
    throw new Error(`Service ${serviceName} is not registered in the container`);
  }
  
  return instance as T;
}
