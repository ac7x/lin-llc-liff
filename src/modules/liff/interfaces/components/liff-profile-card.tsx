'use client';

import React from 'react';
import Image from 'next/image';
import { useLiff } from '../contexts/liff-context';

export interface LiffProfileCardProps {
  className?: string;
}

/**
 * LIFF 個人資料卡片
 * 顯示用戶個人資料
 */
export function LiffProfileCard({ className = '' }: LiffProfileCardProps) {
  const { userProfile, isLoading, isLoggedIn, login } = useLiff();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-md ${className}`}>
        <div className="flex items-center justify-center h-12 mb-4">
          <div className="animate-pulse w-full">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-md text-center ${className}`}>
        <p className="mb-4 text-gray-600">您尚未登入 LINE</p>
        <button 
          onClick={() => login()} 
          className="bg-[#06C755] hover:bg-[#05A748] text-white py-2 px-4 rounded-md transition duration-200"
        >
          使用 LINE 登入
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-md ${className}`}>
      <div className="flex items-center">
        {userProfile?.pictureUrl && (
          <div className="mr-4">
            <Image
              src={userProfile.pictureUrl}
              alt={userProfile.displayName || '使用者頭像'}
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
        )}
        <div>
          <h3 className="font-medium text-lg">{userProfile?.displayName || '未知用戶'}</h3>
          {userProfile?.statusMessage && (
            <p className="text-gray-600 text-sm mt-1">{userProfile.statusMessage}</p>
          )}
          <div className="mt-2 text-xs text-gray-400">
            ID: {userProfile?.userId || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
