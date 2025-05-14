"use client";

export default function ClientHomePage() {
  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>Client Home</h1>
      <p style={{ color: "#666", fontSize: "1.1rem" }}>歡迎來到用戶首頁，這裡可展示個人化資訊、快捷入口等。</p>
    </main>
  );
}
