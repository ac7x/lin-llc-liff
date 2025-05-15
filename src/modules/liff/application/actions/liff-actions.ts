'use server';

import { z } from 'zod';
import { createInstance } from '../../infrastructure/di/container';
import { LiffCommandServiceInterface } from '../commands/liff-command.service.interface';
import { LiffIdValueObject } from '../../domain/valueObjects/liff-id.value-object';

/**
 * LIFF 初始化 Server Action
 * 在服務器端處理 LIFF 初始化流程
 */
export async function initializeLiffAction(liffId?: string): Promise<{
  success: boolean;
  isLoggedIn?: boolean;
  error?: string;
}> {
  try {
    const liffService = createInstance<LiffCommandServiceInterface>('LiffCommandService');
    
    // 使用參數提供的 LIFF ID 或預設值
    const targetLiffId = liffId || LiffIdValueObject.getDefaultLiffId().value;
    
    const success = await liffService.initialize(targetLiffId);
    if (!success) {
      return { success: false, error: '初始化失敗' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('LIFF initialization error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知錯誤' 
    };
  }
}

/**
 * LIFF 登入 Server Action
 */
export async function loginAction(): Promise<{
  success: boolean;
  userId?: string;
  displayName?: string;
  error?: string;
}> {
  try {
    const liffService = createInstance<LiffCommandServiceInterface>('LiffCommandService');
    const result = await liffService.login();
    
    return {
      success: result.isLoggedIn,
      userId: result.userId,
      displayName: result.displayName
    };
  } catch (error) {
    console.error('LIFF login error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知錯誤' 
    };
  }
}

/**
 * LIFF 登出 Server Action
 */
export async function logoutAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const liffService = createInstance<LiffCommandServiceInterface>('LiffCommandService');
    await liffService.logout();
    return { success: true };
  } catch (error) {
    console.error('LIFF logout error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知錯誤' 
    };
  }
}

/**
 * LIFF 分享 Server Action
 */
export async function shareLiffAction(formData: FormData): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  // 定義表單驗證結構
  const schema = z.object({
    text: z.string().min(1, '分享文字不能為空'),
  });
  
  try {
    // 驗證表單數據
    const validatedData = schema.parse({
      text: formData.get('text')
    });
    
    const liffService = createInstance<LiffCommandServiceInterface>('LiffCommandService');
    const result = await liffService.shareTargetPicker(validatedData.text);
    
    return {
      success: result.success,
      status: result.status
    };
  } catch (error) {
    console.error('LIFF share error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知錯誤' 
    };
  }
}
