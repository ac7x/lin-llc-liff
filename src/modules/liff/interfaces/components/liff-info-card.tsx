'use client';

import React from 'react';
import { useLiff } from '../contexts/liff-context';

export interface LiffInfoCardProps {
  className?: string;
}

/**
 * LIFF 資訊卡片
 * 顯示 LIFF 相關信息
 */
export function LiffInfoCard({ className = '' }: LiffInfoCardProps) {
  const { 
    isInitialized, 
    isInClient, 
    liffContext, 
    friendship, 
    isLoading 
  } = useLiff();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-md ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-md ${className}`}>
      <h3 className="font-medium text-lg mb-3">LIFF 資訊</h3>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1 text-gray-600">初始化狀態:</td>
            <td className="font-medium">{isInitialized ? '已初始化' : '未初始化'}</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600">環境:</td>
            <td className="font-medium">{isInClient ? 'LINE App 內' : '外部瀏覽器'}</td>
          </tr>
          {liffContext?.type && (
            <tr>
              <td className="py-1 text-gray-600">類型:</td>
              <td className="font-medium">{liffContext.type}</td>
            </tr>
          )}
          {liffContext?.viewType && (
            <tr>
              <td className="py-1 text-gray-600">視圖類型:</td>
              <td className="font-medium">{liffContext.viewType}</td>
            </tr>
          )}
          {friendship && (
            <tr>
              <td className="py-1 text-gray-600">好友狀態:</td>
              <td className="font-medium">
                {friendship.friendFlag ? (
                  <span className="text-green-600">已加為好友</span>
                ) : (
                  <span className="text-red-500">未加為好友</span>
                )}
              </td>
            </tr>
          )}
          {liffContext?.liffId && (
            <tr>
              <td className="py-1 text-gray-600">LIFF ID:</td>
              <td className="font-mono text-xs">{liffContext.liffId}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
