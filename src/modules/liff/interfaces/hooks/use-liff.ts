'use client';

import { useContext } from 'react';
import { LiffContext } from '../contexts/liff-context';

/**
 * 使用 LIFF Hook
 * 提供在組件中訪問 LIFF 狀態的簡便方法
 */
export function useLiff() {
  const context = useContext(LiffContext);
  
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  
  return context;
}
