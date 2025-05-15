'use client';

import React, { useState } from 'react';
import { useLiff } from '../contexts/liff-context';

export interface LiffActionButtonsProps {
  className?: string;
}

/**
 * LIFF 操作按鈕
 * 提供 LIFF 相關操作功能
 */
export function LiffActionButtons({ className = '' }: LiffActionButtonsProps) {
  const { isLoggedIn, login, logout, openWindow, closeWindow, shareText, scanQrCode } = useLiff();
  const [qrResult, setQrResult] = useState<string | null>(null);

  // 處理登入登出
  const handleAuth = async () => {
    if (isLoggedIn) {
      await logout();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      await login();
    }
  };

  // 處理 QR 掃描
  const handleScan = async () => {
    const result = await scanQrCode();
    if (result && result.value) {
      setQrResult(result.value);
    } else {
      setQrResult('掃描取消或失敗');
    }
  };

  // 處理分享訊息
  const handleShare = async () => {
    await shareText('這是從 LIFF 應用發送的訊息！');
  };

  return (
    <div className={className}>
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="font-medium text-lg mb-4">LIFF 操作</h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAuth}
            className={`px-4 py-2 rounded-md ${
              isLoggedIn 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-[#06C755] hover:bg-[#05A748]'
            } text-white transition-colors`}
          >
            {isLoggedIn ? '登出' : '登入'}
          </button>
          
          <button
            onClick={() => openWindow('https://www.google.com/', true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            開啟外部視窗
          </button>
          
          <button
            onClick={closeWindow}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            關閉視窗
          </button>
          
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
          >
            分享訊息
          </button>
          
          <button
            onClick={handleScan}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors"
          >
            掃描 QR 碼
          </button>
        </div>
        
        {qrResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-sm font-medium">掃描結果:</p>
            <p className="text-sm text-gray-700 break-all">{qrResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
