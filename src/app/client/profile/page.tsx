"use client";
import { useCallback } from "react";
import liff from "@line/liff";

export default function ClientProfilePage() {
  const handleLogin = useCallback(() => {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  }, []);

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <h1>用戶登入</h1>
      <button
        type="button"
        onClick={handleLogin}
        style={{ padding: "0.75rem 2rem", fontSize: "1.2rem", borderRadius: 8, background: "#06C755", color: "#fff", border: "none", cursor: "pointer", marginTop: 24 }}
      >
        使用 LINE LIFF 登入
      </button>
    </main>
  );
}
