'use client';

import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { LiffProfileDto } from '../../infrastructure/dtos/liff-profile.dto';
import liffInitializer from '../client/initialize';

/**
 * LIFF 上下文介面
 */
interface LiffContextType {
  isInitialized: boolean;
  isLoggedIn: boolean;
  userProfile: LiffProfileDto | null;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  liffObject: any;
}

/**
 * 創建 LIFF Context
 */
export const LiffContext = createContext<LiffContextType>({
  isInitialized: false,
  isLoggedIn: false,
  userProfile: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  liffObject: null
});

/**
 * LIFF Provider 屬性
 */
interface LiffProviderProps {
  liffId: string;
  children: ReactNode;
}

/**
 * LIFF Context Provider 組件
 * 提供 LIFF 狀態與操作方法
 */
export function LiffProvider({ liffId, children }: LiffProviderProps) {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<LiffProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [liffObject, setLiffObject] = useState<any>(null);

  /**
   * 初始化 LIFF SDK
   */
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const success = await liffInitializer.initialize(liffId);
        
        if (!success) {
          setError('Failed to initialize LIFF');
          setIsLoading(false);
          return;
        }
        
        setIsInitialized(true);
        setIsLoggedIn(liffInitializer.isLoggedIn());
        
        // 取得 LIFF 物件
        const liffService = liffInitializer.getLiffSdkService();
        if (liffService) {
          setLiffObject(liffService.getLiffInstance());
        }
        
        // 如果已登入，獲取用戶資料
        if (liffInitializer.isLoggedIn()) {
          const profile = await liffInitializer.getProfile();
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Error initializing LIFF:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, [liffId]);

  /**
   * 用戶登入
   */
  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await liffInitializer.login();
      
      if (!success) {
        setError('Failed to login');
        return;
      }
      
      setIsLoggedIn(true);
      
      const profile = await liffInitializer.getProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('Error logging in:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 用戶登出
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await liffInitializer.logout();
      
      if (!success) {
        setError('Failed to logout');
        return;
      }
      
      setIsLoggedIn(false);
      setUserProfile(null);
    } catch (err) {
      console.error('Error logging out:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    isInitialized,
    isLoggedIn,
    userProfile,
    isLoading,
    error,
    login,
    logout,
    liffObject
  };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}
