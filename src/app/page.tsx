
'use client'

import { useContext, useEffect, useState } from "react";
import { LiffContext } from "./Liff";

export default function HomePage() {
  const { isLiffInitialized } = useContext(LiffContext);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (isLiffInitialized) {
      // 當 LIFF 初始化後，顯示提示
      setShowToast(true);

      // 一秒後隱藏提示
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 1000);

      // 清理計時器
      return () => clearTimeout(timer);
    }
  }, [isLiffInitialized]);

  return (
    <main className="relative">
      <h1>Home Page</h1>

      {/* 初始化成功提示 */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity">
          LIFF 初始化成功
        </div>
      )}
    </main>
  );
}
