import { LiffCommandServiceInterface } from "../../application/commands/liff-command.service.interface";
import { LiffQueryServiceInterface } from "../../application/queries/liff-query.service.interface";
import { LiffCommandService } from "../services/liff-command.service";
import { LiffQueryService } from "../services/liff-query.service";
import { LiffSdkService } from "./liff-sdk.service";

// 依賴注入容器的類型定義
type ServiceContainer = {
  [key: string]: any;
};

// 單例服務容器實例
const serviceContainer: ServiceContainer = {};

/**
 * 創建或取得已注冊的服務實例
 */
export function createInstance<T>(serviceType: string): T {
  // 檢查服務是否已經實例化
  if (serviceContainer[serviceType]) {
    return serviceContainer[serviceType] as T;
  }
  
  // 根據服務類型創建新實例
  switch (serviceType) {
    case 'LiffSdkService':
      serviceContainer[serviceType] = LiffSdkService.getInstance();
      break;
      
    case 'LiffQueryService':
      const liffSdk = createInstance<LiffSdkService>('LiffSdkService');
      serviceContainer[serviceType] = new LiffQueryService(liffSdk);
      break;
      
    case 'LiffCommandService':
      const sdkService = createInstance<LiffSdkService>('LiffSdkService');
      serviceContainer[serviceType] = new LiffCommandService(sdkService);
      break;
      
    default:
      throw new Error(`Unknown service type: ${serviceType}`);
  }
  
  return serviceContainer[serviceType] as T;
}
