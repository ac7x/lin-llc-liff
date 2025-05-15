'use client'

import { useLiff, useLiffLogin, useLiffProfile } from "@/modules/liff/interfaces";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";
import { useState } from "react";

export default function LiffDemoPage() {
  const { liff, state } = useLiff();
  const { isLoggedIn, login, logout } = useLiffLogin();
  const { profile, loading, error, fetchProfile } = useLiffProfile();
  const [actionMessage, setActionMessage] = useState<string>("");

  const handleLogin = async () => {
    setActionMessage("登入中...");
    const result = await login();
    if (result.success) {
      setActionMessage("登入成功");
      fetchProfile();
    } else {
      setActionMessage(`登入失敗: ${result.error?.message}`);
    }
  };

  const handleLogout = () => {
    logout();
    setActionMessage("已登出");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">LIFF 功能展示頁</h1>

      {/* LIFF 狀態信息 */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">LIFF 狀態</h2>
        <p>初始化狀態: {state.isInitialized ? "✅ 已初始化" : "❌ 未初始化"}</p>
        {state.hasError && (
          <p className="text-red-500">錯誤: {state.error}</p>
        )}
        <p>登入狀態: {isLoggedIn ? "✅ 已登入" : "❌ 未登入"}</p>
      </div>

      {/* 登入/登出按鈕 */}
      <div className="mb-6">
        {!isLoggedIn ? (
          <button
            onClick={handleLogin}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={!state.isInitialized || loading}
          >
            登入 LINE
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            登出
          </button>
        )}

        {actionMessage && (
          <p className="mt-2 text-sm text-gray-600">{actionMessage}</p>
        )}
      </div>

      {/* 用戶資料 */}
      {isLoggedIn && (
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">用戶資料</h2>
          {loading ? (
            <p>載入中...</p>
          ) : error ? (
            <p className="text-red-500">錯誤: {error.message}</p>
          ) : profile ? (
            <div className="flex items-start space-x-4">
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <p><strong>名稱:</strong> {profile.displayName}</p>
                <p><strong>狀態:</strong> {profile.statusMessage || "無狀態訊息"}</p>
                <p><strong>用戶ID:</strong> {profile.userId}</p>
              </div>
            </div>
          ) : (
            <p>未取得用戶資料</p>
          )}
        </div>
      )}

      {/* 環境資訊 */}
      {liff && state.isInitialized && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">環境資訊</h2>
          <p><strong>LIFF ID:</strong> {liff.getOS()}</p>
          <p><strong>操作系統:</strong> {liff.getOS()}</p>
          <p><strong>語言:</strong> {liff.getLanguage()}</p>
          <p><strong>LINE 版本:</strong> {liff.getLineVersion()}</p>
          <p><strong>是否在 LINE 中:</strong> {liff.isInClient() ? "是" : "否"}</p>
        </div>
      )}
      {/* 全域底部導覽列 */}
      <GlobalBottomNav />
    </div>
  );
}
