'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { LiffContextDto, LiffFriendshipDto, LiffUserDto } from '../../application/dtos/liff-user.dto';
import { initializeLiffAction, loginAction, logoutAction } from '../../application/actions/liff-actions';

// LIFF 上下文類型定義
interface LiffContextType {
  isInitialized: boolean;
  isLoggedIn: boolean;
  userProfile: LiffUserDto | null;
  liffContext: LiffContextDto | null;
  friendship: LiffFriendshipDto | null;
  isLoading: boolean;
  isInClient: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  openWindow: (url: string, external: boolean) => void;
  closeWindow: () => void;
  shareText: (text: string) => Promise<boolean>;
  scanQrCode: () => Promise<{ value: string } | null>;
  refresh: () => Promise<void>;
}

// 默認上下文值
const defaultContextValue: LiffContextType = {
  isInitialized: false,
  isLoggedIn: false,
  userProfile: null,
  liffContext: null,
  friendship: null,
  isLoading: true,
  isInClient: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  openWindow: () => {},
  closeWindow: () => {},
  shareText: async () => false,
  scanQrCode: async () => null,
  refresh: async () => {},
};

// 創建 LIFF Context
const LiffContext = createContext<LiffContextType>(defaultContextValue);

// LIFF Provider 屬性
interface LiffProviderProps {
  children: ReactNode;
  liffId?: string;
}

/**
 * LIFF Context Provider
 * 提供 LIFF 相關的狀態和操作方法
 */
export function LiffProvider({ children, liffId }: LiffProviderProps) {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<LiffUserDto | null>(null);
  const [liffContext, setLiffContext] = useState<LiffContextDto | null>(null);
  const [friendship, setFriendship] = useState<LiffFriendshipDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInClient, setIsInClient] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化 LIFF
  useEffect(() => {
    async function initLiff() {
      try {
        setIsLoading(true);
        
        // 初始化 LIFF SDK
        const { success, error } = await initializeLiffAction(liffId);
        
        if (!success) {
          setError(error || '初始化失敗');
          setIsLoading(false);
          return;
        }

        setIsInitialized(true);
        await fetchLiffInfo();
        
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知錯誤');
      } finally {
        setIsLoading(false);
      }
    }

    initLiff();
  }, [liffId]);

  // 獲取 LIFF 資訊
  const fetchLiffInfo = async () => {
    try {
      // 這裡需要通過客戶端的方式獲取資訊，因為某些 LIFF API 只能在客戶端調用
      // 這裡我們模擬對客戶端 SDK 的直接訪問
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      
      // 檢查是否已初始化
      if (!liff.isReady()) return;
      
      // 獲取登入狀態
      const loggedIn = liff.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      // 獲取上下文
      const ctx = liff.getContext();
      setLiffContext(ctx);
      
      // 檢查是否在 LIFF 瀏覽器內
      setIsInClient(liff.isInClient());
      
      // 如果已登入，獲取用戶資料和好友狀態
      if (loggedIn) {
        try {
          const profile = await liff.getProfile();
          setUserProfile({
            ...profile,
            isLoggedIn: true
          });
          
          try {
            const friendStatus = await liff.getFriendship();
            setFriendship(friendStatus);
          } catch (friendErr) {
            console.error('Failed to get friendship status:', friendErr);
          }
        } catch (profileErr) {
          console.error('Failed to get user profile:', profileErr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch LIFF info:', err);
      setError(err instanceof Error ? err.message : '獲取 LIFF 資訊失敗');
    }
  };

  // 登入
  const login = async () => {
    try {
      const result = await loginAction();
      if (result.success) {
        setIsLoggedIn(true);
        await fetchLiffInfo();
      } else {
        setError(result.error || '登入失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入過程發生錯誤');
    }
  };

  // 登出
  const logout = async () => {
    try {
      await logoutAction();
      setIsLoggedIn(false);
      setUserProfile(null);
      setFriendship(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登出過程發生錯誤');
    }
  };

  // 開啟視窗
  const openWindow = async (url: string, external: boolean) => {
    try {
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      
      if (!liff.isReady()) {
        throw new Error('LIFF not initialized');
      }
      
      liff.openWindow({ url, external });
    } catch (err) {
      setError(err instanceof Error ? err.message : '無法開啟視窗');
    }
  };

  // 關閉視窗
  const closeWindow = async () => {
    try {
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      
      if (!liff.isReady()) {
        throw new Error('LIFF not initialized');
      }
      
      liff.closeWindow();
    } catch (err) {
      setError(err instanceof Error ? err.message : '無法關閉視窗');
    }
  };

  // 分享文字
  const shareText = async (text: string): Promise<boolean> => {
    try {
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      
      if (!liff.isReady()) {
        throw new Error('LIFF not initialized');
      }
      
      const result = await liff.shareTargetPicker([
        {
          type: 'text',
          text: text
        }
      ]);
      
      return !!result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '分享失敗');
      return false;
    }
  };

  // 掃描 QR 碼
  const scanQrCode = async (): Promise<{ value: string } | null> => {
    try {
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      
      if (!liff.isReady()) {
        throw new Error('LIFF not initialized');
      }
      
      return await liff.scanCodeV2();
    } catch (err) {
      setError(err instanceof Error ? err.message : '掃描 QR 碼失敗');
      return null;
    }
  };

  // 重新獲取資訊
  const refresh = async () => {
    setIsLoading(true);
    try {
      await fetchLiffInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新資訊失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 上下文值
  const contextValue: LiffContextType = {
    isInitialized,
    isLoggedIn,
    userProfile,
    liffContext,
    friendship,
    isLoading,
    isInClient,
    error,
    login,
    logout,
    openWindow,
    closeWindow,
    shareText,
    scanQrCode,
    refresh
  };

  return (
    <LiffContext.Provider value={contextValue}>
      {children}
    </LiffContext.Provider>
  );
}

// LIFF Context Hook
export const useLiff = () => useContext(LiffContext);
