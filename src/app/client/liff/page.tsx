'use client'

import { useLiffLogin, useLiffProfile } from "@/modules/liff/interfaces";
import { useState } from "react";

export default function LiffDemoPage() {
    const { isLoggedIn, login, logout } = useLiffLogin();
  const { liff, state } = useLiff();seLiffProfile();
  const { isLoggedIn, login, logout } = useLiffLogin();
  const { profile, loading, error, fetchProfile } = useLiffProfile();
  const [actionMessage, setActionMessage] = useState<string>("");    const handleLogin = async () => {

  const handleLogin = async () => {gin();
    setActionMessage("登入中...");
    const result = await login();age("登入成功");
    if (result.success) {
      setActionMessage("登入成功");
      fetchProfile();setActionMessage(`登入失敗: ${result.error?.message}`);
    } else {
      setActionMessage(`登入失敗: ${result.error?.message}`);;
    }
  };    const handleLogout = () => {

  const handleLogout = () => {tionMessage("已登出");
    logout();
    setActionMessage("已登出");
  };    return (
iv className="p-4">
  return (="text-2xl font-bold mb-6">LIFF 功能展示頁</h1>
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">LIFF 功能展示頁</h1>            {/* LIFF 狀態信息 */}
ame="mb-6 p-4 bg-gray-100 rounded-lg">
      {/* LIFF 狀態信息 */}-2">LIFF 狀態</h2>
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">未初始化"}</p>
        <h2 className="text-lg font-semibold mb-2">LIFF 狀態</h2>
        <p>初始化狀態: {state.isInitialized ? "✅ 已初始化" : "❌ 未初始化"}</p>Name="text-red-500">錯誤: {state.error}</p>
        {state.hasError && (
          <p className="text-red-500">錯誤: {state.error}</p>      <p>登入狀態: {isLoggedIn ? "✅ 已登入" : "❌ 未登入"}</p>
        )}
        <p>登入狀態: {isLoggedIn ? "✅ 已登入" : "❌ 未登入"}</p>
      </div>            {/* 登入/登出按鈕 */}
sName="mb-6">
      {/* 登入/登出按鈕 */} ? (
      <div className="mb-6">ton
        {!isLoggedIn ? (      onClick={handleLogin}
          <button "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleLogin} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={!state.isInitialized || loading}             登入 LINE
          > </button>
            登入 LINE (
          </button>       <button
        ) : (      onClick={handleLogout}
          <button bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            onClick={handleLogout} 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"             登出
          >      </button>
            登出
          </button>
        )}                {actionMessage && (
sName="mt-2 text-sm text-gray-600">{actionMessage}</p>
        {actionMessage && (
          <p className="mt-2 text-sm text-gray-600">{actionMessage}</p>  </div>
        )}
      </div>            {/* 用戶資料 */}
gedIn && (
      {/* 用戶資料 */}lassName="p-4 border rounded-lg">
      {isLoggedIn && (-semibold mb-4">用戶資料</h2>
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">用戶資料</h2>  <p>載入中...</p>
          {loading ? (rror ? (
            <p>載入中...</p> <p className="text-red-500">錯誤: {error.message}</p>
          ) : error ? (
            <p className="text-red-500">錯誤: {error.message}</p>div className="flex items-start space-x-4">
          ) : profile ? (
            <div className="flex items-start space-x-4">             src={profile.pictureUrl}
              <Imageile.displayName}
                src={profile.pictureUrl}"w-16 h-16 rounded-full"
                alt={profile.displayName}
                width={64}            <div>
                height={64}             <p><strong>名稱:</strong> {profile.displayName}</p>
                className="w-16 h-16 rounded-full"statusMessage || "無狀態訊息"}</p>
              />
              <div>
                <p><strong>名稱:</strong> {profile.displayName}</p>    </div>
                <p><strong>狀態:</strong> {profile.statusMessage || "無狀態訊息"}</p>  ) : (
                <p><strong>用戶ID:</strong> {profile.userId}</p>         <p>未取得用戶資料</p>
              </div>
            </div>    </div>
          ) : (
            <p>未取得用戶資料</p>
          )}            {/* 環境資訊 */}
        </div>&& state.isInitialized && (
      )}4 bg-gray-50 rounded-lg">
 mb-2">環境資訊</h2>
      {/* 環境資訊 */}}</p>
      {liff && state.isInitialized && (()}</p>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">anguage()}</p>
          <h2 className="text-lg font-semibold mb-2">環境資訊</h2>LineVersion()}</p>
          <p><strong>LIFF ID:</strong> {liff.getOS()}</p>nt() ? "是" : "否"}</p>
          <p><strong>操作系統:</strong> {liff.getOS()}</p>
          <p><strong>語言:</strong> {liff.getLanguage()}</p>
          <p><strong>LINE 版本:</strong> {liff.getLineVersion()}</p></div>
          <p><strong>是否在 LINE 中:</strong> {liff.isInClient() ? "是" : "否"}</p>
        </div>
      )}    </div>
  );
}
