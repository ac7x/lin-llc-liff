'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { useLiff } from '../hooks/use-liff';

/**
 * LIFF 登入按鈕屬性
 */
interface LiffLoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  loadingText?: string;
  loggedInText?: string;
  showState?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * LIFF 登入按鈕元件
 * 提供登入 LIFF 的按鈕，自動處理登入狀態顯示
 */
export function LiffLoginButton({
  children = '使用 LINE 登入',
  loadingText = '登入中...',
  loggedInText = '已登入',
  showState = false,
  variant = 'primary',
  ...props
}: LiffLoginButtonProps) {
  const { isLoggedIn, isLoading, login } = useLiff();
  
  const handleClick = async () => {
    if (!isLoggedIn && !isLoading) {
      await login();
    }
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'outline':
        return 'bg-transparent border border-green-500 text-green-500 hover:bg-green-50';
      default:
        return 'bg-green-500 hover:bg-green-600 text-white';
    }
  };
  
  const buttonText = isLoading
    ? loadingText
    : isLoggedIn && showState
    ? loggedInText
    : children;
  
  const isDisabled = isLoading || (isLoggedIn && !showState);
  
  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors duration-200 ${getVariantStyles()} disabled:opacity-50 disabled:cursor-not-allowed ${
        props.className || ''
      }`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {buttonText}
    </button>
  );
}

/**
 * LIFF 登出按鈕屬性
 */
interface LiffLogoutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * LIFF 登出按鈕元件
 * 提供登出 LIFF 的按鈕，只在登入狀態下顯示
 */
export function LiffLogoutButton({
  children = '登出',
  loadingText = '登出中...',
  variant = 'outline',
  ...props
}: LiffLogoutButtonProps) {
  const { isLoggedIn, isLoading, logout } = useLiff();
  
  const handleClick = async () => {
    if (isLoggedIn && !isLoading) {
      await logout();
    }
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'outline':
        return 'bg-transparent border border-red-500 text-red-500 hover:bg-red-50';
      default:
        return 'bg-transparent border border-red-500 text-red-500 hover:bg-red-50';
    }
  };
  
  if (!isLoggedIn) return null;
  
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors duration-200 ${getVariantStyles()} disabled:opacity-50 disabled:cursor-not-allowed ${
        props.className || ''
      }`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {isLoading ? loadingText : children}
    </button>
  );
}
