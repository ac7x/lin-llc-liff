'use client';

import { ReactNode, useEffect, useState } from 'react';
import { initializeFirebase } from '../../../lib/firebase';

/**
 * Firebase Provider 屬性
 */
interface FirebaseProviderProps {
  children: ReactNode;
}

/**
 * Firebase Provider 元件
 * 負責初始化 Firebase 並在 App 中提供 Firebase 服務
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // 只在客戶端初始化 Firebase
    if (typeof window !== 'undefined') {
      try {
        initializeFirebase();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    }
  }, []);
  
  return <>{children}</>;
}
