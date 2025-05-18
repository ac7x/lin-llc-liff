"use client";
import { GlobalBottomNav } from "@/modules/shared/interfaces/navigation/GlobalBottomNav";

export default function WorkTaskPage() {
  return (
    <>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>Client Work Tasks</h1>
        <p style={{ color: "#666", fontSize: "1.1rem" }}>歡迎來到工作任務頁面，這裡可展示相關資訊與功能。</p>
      </main>
      <GlobalBottomNav />
    </>
  );
}