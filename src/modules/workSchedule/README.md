# 工作排程模組 (Work Schedule Module)

基於 Clean Architecture 原則和 vis-timeline 函式庫建構的工作排程管理模組。

## 目錄結構

```
src/modules/workSchedule/
├── domain/                     # 領域層
│   ├── model/
│   │   └── WorkItem.ts        # 工作項目實體和值物件
│   ├── repository/
│   │   └── WorkItemRepo.ts    # 儲存庫介面
│   └── service/
│       └── ScheduleService.ts # 領域服務
├── application/               # 應用層
│   ├── usecases/
│   │   └── UpdateWorkTime.ts  # 更新工作時間用例
│   └── dto/
│       └── WorkItemDTO.ts     # 資料傳輸物件
├── infrastructure/            # 基礎設施層
│   ├── repository/
│   │   └── WorkItemApiRepo.ts # API 儲存庫實作
│   └── adapter/
│       └── TimelineAdapter.ts # vis-timeline 適配器
├── interfaces/                # 介面層
│   ├── components/
│   │   ├── Timeline.tsx       # 時間軸元件
│   │   └── Toolbar.tsx        # 工具列元件
│   └── hooks/
│       └── useTimelineEvents.ts # 時間軸事件處理 Hook
├── types/
│   └── timeline.ts            # 型別定義
├── utils/
│   └── timeUtils.ts           # 時間工具函式
├── constants/
│   └── timelineConstants.ts   # 常數定義
├── config/
│   └── env.ts                 # 環境設定
├── styles/
│   └── timeline.module.css    # 樣式檔案
└── index.ts                   # 主要導出檔案
```

## 功能特點

### 🏗️ Clean Architecture
- **領域層**: 純業務邏輯，不依賴外部函式庫
- **應用層**: 用例和 DTO，協調領域物件
- **基礎設施層**: 外部服務整合 (API、vis-timeline)
- **介面層**: React 元件和使用者互動

### ⏰ vis-timeline 整合
- 拖拽調整工作時間
- 多種視圖模式 (天、週、月)
- 即時更新和同步
- 自訂樣式和主題

### 📋 工作項目管理
- 支援多種工作類型 (任務、會議、休息、專案、維護)
- 狀態追蹤 (計劃中、進行中、已完成、已取消、逾期)
- 優先級管理 (低、中、高、緊急)
- 標籤和中繼資料支援

### 🎨 使用者介面
- 響應式設計
- 深色/淺色主題支援
- 無障礙支援
- 觸控裝置友善

## 快速開始

### 1. 基本使用

```typescript
import { Timeline, Toolbar, createWorkScheduleModule } from '../modules/workSchedule';

function MyComponent() {
  const workScheduleModule = createWorkScheduleModule();

  return (
    <div>
      <Toolbar 
        onViewModeChange={(mode) => console.log(mode)}
        onFilterChange={(filters) => console.log(filters)}
      />
      <Timeline
        workItems={workItems}
        onItemUpdate={(item) => console.log(item)}
        onItemCreate={(item) => console.log(item)}
      />
    </div>
  );
}
```

### 2. 建立工作項目

```typescript
import { WorkItemVO, WorkItemType, WorkItemStatus, WorkItemPriority } from '../modules/workSchedule';

const workItem = new WorkItemVO(
  'unique-id',
  '專案會議',
  new Date('2024-01-15T09:00:00'),
  new Date('2024-01-15T10:30:00'),
  WorkItemType.MEETING,
  WorkItemStatus.PLANNED,
  WorkItemPriority.HIGH,
  'user-id',
  '張小明',
  '討論 Q1 專案進度',
  ['專案', '會議']
);
```

### 3. 使用儲存庫

```typescript
import { WorkItemApiRepository } from '../modules/workSchedule';

const repository = new WorkItemApiRepository();

// 取得工作項目
const workItems = await repository.findByTimeRange(
  new Date('2024-01-15T00:00:00'),
  new Date('2024-01-15T23:59:59')
);

// 儲存工作項目
const savedItem = await repository.save(workItem);
```

### 4. 使用用例

```typescript
import { UpdateWorkTimeUseCase } from '../modules/workSchedule';

const updateWorkTimeUseCase = new UpdateWorkTimeUseCase(repository);

await updateWorkTimeUseCase.execute([
  {
    id: 'work-item-1',
    startTime: new Date('2024-01-15T10:00:00'),
    endTime: new Date('2024-01-15T11:00:00')
  }
]);
```

## API 參考

### WorkItem 實體

```typescript
interface WorkItem {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: WorkItemType;
  status: WorkItemStatus;
  assigneeId?: string;
  assigneeName?: string;
  priority: WorkItemPriority;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Timeline 元件 Props

```typescript
interface TimelineProps {
  workItems: WorkItem[];
  onItemUpdate?: (item: WorkItem) => void;
  onItemCreate?: (item: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onItemDelete?: (itemId: string) => void;
  onItemSelect?: (item: WorkItem | null) => void;
  onTimeRangeChange?: (start: Date, end: Date) => void;
  viewMode?: ViewMode;
  editable?: boolean;
  selectable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

### Toolbar 元件 Props

```typescript
interface ToolbarProps {
  onViewModeChange?: (mode: ViewMode) => void;
  onFilterChange?: (filters: WorkItemFilters) => void;
  onDateRangeChange?: (start: Date, end: Date) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  disabled?: boolean;
  className?: string;
}
```

## 自訂設定

### 環境設定

在 `src/modules/workSchedule/config/env.ts` 中調整設定：

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  ENDPOINTS: {
    WORK_ITEMS: '/work-items',
    USERS: '/users'
  },
  TIMEOUT: 10000
};
```

### 樣式自訂

在 `src/modules/workSchedule/styles/timeline.module.css` 中自訂樣式：

```css
.timeline-item.custom-type {
  background-color: #your-color;
  border-color: #your-border-color;
  color: #your-text-color;
}
```

### 常數調整

在 `src/modules/workSchedule/constants/timelineConstants.ts` 中調整常數：

```typescript
export const CUSTOM_WORK_ITEM_COLORS = {
  task: '#3b82f6',
  meeting: '#10b981',
  // ... 其他顏色
};
```

## 測試

### 單元測試範例

```typescript
import { WorkItemVO, WorkItemType, WorkItemStatus, WorkItemPriority } from '../src/modules/workSchedule';

describe('WorkItemVO', () => {
  it('should create valid work item', () => {
    const workItem = new WorkItemVO(
      'test-id',
      'Test Task',
      new Date('2024-01-15T09:00:00'),
      new Date('2024-01-15T10:00:00'),
      WorkItemType.TASK,
      WorkItemStatus.PLANNED,
      WorkItemPriority.MEDIUM
    );

    expect(workItem.isValid()).toBe(true);
  });
});
```

### 整合測試範例

```typescript
import { render, screen } from '@testing-library/react';
import { Timeline } from '../src/modules/workSchedule';

describe('Timeline Component', () => {
  it('should render work items', () => {
    const workItems = [/* ... */];
    render(<Timeline workItems={workItems} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

## 效能最佳化

### 虛擬化

對於大量工作項目，Timeline 元件支援虛擬化：

```typescript
<Timeline
  workItems={largeWorkItemsList}
  virtualization={true}
  maxVisibleItems={100}
/>
```

### 記憶化

使用 React.memo 和 useMemo 來最佳化效能：

```typescript
const MemoizedTimeline = React.memo(Timeline);
const memoizedWorkItems = useMemo(() => processWorkItems(rawData), [rawData]);
```

## 問題排解

### 常見問題

1. **vis-timeline 載入失敗**
   ```bash
   npm install vis-timeline vis-data
   ```

2. **樣式不正確**
   - 確認已匯入 CSS 檔案
   - 檢查 CSS 模組設定

3. **TypeScript 錯誤**
   - 確認已安裝 @types/vis-timeline
   - 檢查型別定義檔案

### 除錯模式

啟用除錯模式：

```typescript
import { TIMELINE_FEATURES } from '../modules/workSchedule';

// 在開發環境啟用除錯
if (process.env.NODE_ENV === 'development') {
  TIMELINE_FEATURES.DEBUG_MODE = true;
}
```

## 貢獻

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權

此專案使用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案。

## 相關資源

- [vis-timeline 官方文件](https://visjs.github.io/vis-timeline/docs/timeline/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React 最佳實踐](https://react.dev/learn)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
