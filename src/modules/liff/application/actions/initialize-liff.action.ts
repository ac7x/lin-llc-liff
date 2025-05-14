'use server';

import { revalidatePath } from 'next/cache';
import { createInstance } from '../../infrastructure/di/container';
import { LiffInitializerService } from '../services/liff-initializer.service';

/**
 * 初始化 LIFF Server Action
 * 在服務器端處理 LIFF 初始化流程
 */
export async function initializeLiffAction(liffId: string): Promise<{
  success: boolean;
  isLoggedIn?: boolean;
  error?: string;
}> {
  try {
    const liffService = createInstance<LiffInitializerService>('LiffInitializerService');
    
    const success = await liffService.initialize({
      liffId,
      withLoginOnExternalBrowser: true
    });
    
    if (!success) {
      return {
        success: false,
        error: 'Failed to initialize LIFF SDK'
      };
    }
    
    const isLoggedIn = liffService.getLoginStatus();
    
    return {
      success: true,
      isLoggedIn
    };
  } catch (error) {
    console.error('Error in initializeLiff action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * 用戶登入 Server Action
 * 處理用戶登入流程
 */
export async function loginAction(): Promise<{
  success: boolean;
  user?: {
    id: string;
    displayName: string;
    pictureUrl?: string;
    email?: string;
  };
  error?: string;
}> {
  try {
    const liffService = createInstance<LiffInitializerService>('LiffInitializerService');
    
    const user = await liffService.handleLogin();
    
    if (!user) {
      return {
        success: false,
        error: 'Failed to login'
      };
    }
    
    revalidatePath('/');
    
    return {
      success: true,
      user: {
        id: user.id,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Error in login action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * 用戶登出 Server Action
 * 處理用戶登出流程
 */
export async function logoutAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const liffService = createInstance<LiffInitializerService>('LiffInitializerService');
    
    const success = await liffService.handleLogout();
    
    revalidatePath('/');
    
    return {
      success
    };
  } catch (error) {
    console.error('Error in logout action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
