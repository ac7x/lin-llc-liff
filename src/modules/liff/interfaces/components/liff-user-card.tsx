'use client';

import Image from 'next/image';
import { useLiff } from '../hooks/use-liff';
import { LiffLogoutButton } from './liff-login-button';

/**
 * LIFF 用戶資訊卡屬性
 */
interface LiffUserCardProps {
  showLogoutButton?: boolean;
  className?: string;
}

/**
 * LIFF 用戶資訊卡元件
 * 展示用戶基本資訊與登出按鈕
 */
export function LiffUserCard({ showLogoutButton = true, className = '' }: LiffUserCardProps) {
  const { isLoggedIn, userProfile, isLoading } = useLiff();

  if (isLoading) {
    return (
      <div className={`p-4 border rounded-lg bg-white shadow-sm ${className}`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 h-16 w-16 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !userProfile) {
    return (
      <div className={`p-4 border rounded-lg bg-white shadow-sm text-center ${className}`}>
        <p className="text-gray-500">尚未登入</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg bg-white shadow-sm ${className}`}>
      <div className="flex flex-col items-center">
        {userProfile.pictureUrl ? (
          <div className="relative w-16 h-16 rounded-full overflow-hidden mb-4">
            <Image
              src={userProfile.pictureUrl}
              alt={userProfile.displayName}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <span className="text-gray-500 text-lg font-bold">
              {userProfile.displayName.charAt(0)}
            </span>
          </div>
        )}
        
        <h3 className="text-lg font-medium">{userProfile.displayName}</h3>
        
        {userProfile.email && (
          <p className="text-sm text-gray-500 mt-1">{userProfile.email}</p>
        )}

        {userProfile.statusMessage && (
          <p className="text-sm text-gray-600 mt-2 italic">&quot;{userProfile.statusMessage}&quot;</p>
        )}

        {showLogoutButton && (
          <div className="mt-4">
            <LiffLogoutButton variant="outline" className="text-sm" />
          </div>
        )}
      </div>
    </div>
  );
}
