# LineBot 模組

此模組實現了與 Line Bot 相關的業務邏輯，遵循 `.github/codegen.md` 中的架構規範。

## 模組結構

```
lineBot/
├── application/          # 應用層
│   ├── lineBot-command.service.ts
│   ├── lineBot-query.service.ts
│   └── README.md
├── domain/               # 領域層
│   ├── repositories/
│   │   └── lineBot-repository.interface.ts
│   ├── services/
│   │   └── lineBot-domain.service.ts
│   └── README.md
├── infrastructure/       # 基礎設施層
│   ├── repositories/
│   │   └── lineBot-repository.ts
│   └── README.md
├── interfaces/           # 介面層
│   ├── components/
│   │   └── LineBotProvider.tsx
│   ├── hooks/
│   │   └── useLineBot.ts
│   └── README.md
└── index.ts              # 模組入口文件
```

## 使用方式

### 1. 引入模組

```typescript
import { LineBotProvider, useLineBot } from './lineBot';
```

### 2. 使用 LineBotProvider

在應用的根組件中包裹 `LineBotProvider`：

```tsx
import { LineBotProvider } from './lineBot';

function App() {
  return (
    <LineBotProvider>
      <YourAppComponents />
    </LineBotProvider>
  );
}
```

### 3. 使用 Hook

在子組件中使用 `useLineBot` 獲取 Line Bot 的功能：

```tsx
import { useLineBot } from './lineBot';

function LineBotComponent() {
  const { sendMessage } = useLineBot();

  const handleSendMessage = () => {
    sendMessage('Hello, Line Bot!');
  };

  return <button onClick={handleSendMessage}>Send Message</button>;
}
```
```
