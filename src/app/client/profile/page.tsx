'use client';

import { LiffContext } from '@/modules/line/liff/interfaces/Liff';
import { firebaseApp } from '@/modules/shared/infrastructure/persistence/firebase/client';
import { GlobalBottomNav } from '@/modules/shared/interfaces/navigation/GlobalBottomNav';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useContext, useEffect, useRef, useState } from 'react';

export default function UserProfilePage() {
  const { isLiffInitialized, firebaseLogin, firebaseUser, liffError, lineProfile, logout, isLoggedIn, isLiffLoggedIn, login } = useContext(LiffContext);
  const [actionMessage, setActionMessage] = useState<string>("");
  const autoLoginTriggered = useRef(false);
  const [userAssets, setUserAssets] = useState<{ coin: number; diamond: number } | null>(null);

  // 自動登入邏輯
  useEffect(() => {
    if (isLiffLoggedIn && !isLoggedIn && isLiffInitialized && !autoLoginTriggered.current) {
      autoLoginTriggered.current = true;
      firebaseLogin()
        .then(() => setActionMessage("登入成功"))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setActionMessage(`登入失敗: ${msg || "未知錯誤"}`);
        });
    }
    if (!isLiffLoggedIn || !isLiffInitialized) {
      autoLoginTriggered.current = false;
    }
  }, [isLiffLoggedIn, isLoggedIn, isLiffInitialized, firebaseLogin]);

  // 取得用戶資產
  useEffect(() => {
    const fetchAssets = async () => {
      if (!firebaseUser) {
        setUserAssets(null);
        return;
      }
      try {
        const db = getFirestore(firebaseApp);
        // 只從 workAsset 取得資產，與 workMember 對應
        const assetDoc = await getDoc(doc(db, 'workAsset', firebaseUser.uid));
        if (assetDoc.exists()) {
          const { coin, diamond } = assetDoc.data();
          setUserAssets({ coin, diamond });
        }
      } catch (err) {
        console.error('讀取資產失敗:', err);
      }
    };
    fetchAssets();
  }, [firebaseUser]);

  const handleLogout = async () => {
    try {
      await logout();
      setActionMessage("已登出");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage(`登出失敗: ${msg || "未知錯誤"}`);
    }
  };

  return (
    <>
      <main className="py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">LINE 用戶資料</h1>

        <div className="space-y-6">
          {/* 用戶基本資料 */}
          {lineProfile && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center space-x-4">
                {lineProfile.pictureUrl && (
                  <img
                    src={lineProfile.pictureUrl}
                    alt="個人頭像"
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-medium">{lineProfile.displayName}</h3>
                  <p className="text-sm text-gray-500">{lineProfile.userId}</p>
                </div>
              </div>
            </div>
          )}

          {/* 用戶資產 */}
          {userAssets && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-medium text-lg mb-4">我的資產</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-600 text-2xl font-bold">{userAssets.coin}</p>
                  <p className="text-sm text-gray-600">金幣</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-600 text-2xl font-bold">{userAssets.diamond}</p>
                  <p className="text-sm text-gray-600">鑽石</p>
                </div>
              </div>
            </div>
          )}

          {/* 登入狀態和操作 */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-medium text-lg mb-4">登入狀態</h3>
            <div className="space-y-2">
              <p className="text-sm">
                LIFF 登入狀態: <span className="font-mono">{isLiffLoggedIn ? '已登入' : '未登入'}</span>
              </p>
              <p className="text-sm">
                Firebase 登入狀態: <span className="font-mono">{isLoggedIn ? '已登入' : '未登入'}</span>
              </p>
              {actionMessage && (
                <p className="text-sm text-blue-600">{actionMessage}</p>
              )}
              <div className="flex gap-2 mt-4">
                {!isLiffLoggedIn && (
                  <button
                    onClick={() => login()}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    LINE 登入
                  </button>
                )}
                {isLiffLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    登出
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {liffError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <p className="text-sm">{liffError}</p>
            </div>
          )}
        </div>
      </main>
      <GlobalBottomNav />
    </>
  );
}