# LIFF 模組

本模組基於領域驅動設計 (DDD) 和命令查詢責任分離 (CQRS) 架構，封裝了 LINE LIFF (LINE Frontend Framework) 的功能。

## 架構概述

LIFF 模組遵循 DDD 分層架構：

### 1. 介面層 (Interface Layer)

位置：`src/modules/liff/interfaces`

提供與使用者介面互動的元件及 Hook：
- `LiffProvider`: React Context 提供者，初始化 LIFF 並提供狀態
- `useLiff`: 訪問 LIFF 實例與狀態的 Hook
- `useLiffLogin`: 處理登入/登出流程的 Hook
- `useLiffProfile`: 獲取用戶檔案的 Hook

### 2. 應用層 (Application Layer)

位置：`src/modules/liff/application`

協調領域服務並處理應用流程：
- `LiffQueryService`: 查詢 LIFF 狀態
- `LiffCommandService`: 處理 LIFF 初始化等命令
- DTO 資料傳輸物件：`LiffDto`, `LiffStateDto`

### 3. 領域層 (Domain Layer)

位置：`src/modules/liff/domain`

包含核心業務模型與邏輯：
- `LiffEntity`: 代表 LIFF SDK 的實體
- `LiffStateValueObject`: 代表 LIFF 狀態的值物件
- `ILiffDomainService`: 領域服務介面
- `ILiffRepository`: 儲存庫介面

### 4. 基礎設施層 (Infrastructure Layer)

位置：`src/modules/liff/infrastructure`

提供技術實現：
- `LiffRepository`: 實作 LIFF SDK 初始化與狀態管理

## 使用方法

### 基本設置

1. 將環境變數 `LIFF_ID` 設置為你的 LIFF ID
2. 確保在應用程式根層級使用 `LiffProvider` 包裹

```tsx
// 在 layout.tsx 中
import { LiffProvider } from "@/modules/liff/interfaces";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}
```

### 在組件中使用 LIFF

```tsx
'use client'
import { useLiff, useLiffLogin, useLiffProfile } from "@/modules/liff/interfaces";

export default function MyComponent() {
  // 取得 LIFF 實例和狀態
  const { liff, state } = useLiff();
  
  // 取得登入功能
  const { isLoggedIn, login, logout } = useLiffLogin();
  
  // 取得用戶檔案
  const { profile, loading, error, fetchProfile } = useLiffProfile();
  
  // 使用這些 Hook 實現 LIFF 功能
}
```

## 擴展指南

如需添加新的 LIFF 功能：

1. 先在領域層定義模型、介面或服務
2. 在基礎設施層實現所需的技術細節
3. 在應用層添加相應的命令或查詢服務
4. 在介面層提供組件或 Hook
5. 最後在 `interfaces/index.ts` 導出公開 API
