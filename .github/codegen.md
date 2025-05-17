# Next.js + DDD + CQRS 進階架構指南

## 架構核心原則

### 基礎原則
- ✅ **職責分離** (Separation of Responsibility)  
  每層只負責單一職責，降低模組耦合
- ✅ **關注點分離** (Separation of Concerns)  
  清楚拆分 Domain Logic / Application Logic / Infrastructure / UI
- ✅ **最小化客戶端** (Minimal Client)  
  資料存取與邏輯集中於 Server Components
- ✅ **領域驅動設計** (Domain-Driven Design)  
  以業務核心設計 Entity / Aggregate / Repository / Service
- ✅ **命令查詢分離** (CQRS)  
  明確分離查詢與修改操作，提升維護性
- ✅ **失敗快速原則** (Fail Fast)  
  及早驗證輸入，在邊界處理錯誤
- ✅ **依賴倒置原則** (Dependency Inversion)  
  高層模組不依賴低層模組，兩者依賴抽象
- ✅ **契約優先設計** (Contract-First Design)  
  優先定義介面與契約，再實現具體實作

## 架構分層及職責

### 1. 介面層 (Interface Layer)
**職責**：用戶交互與輸入/輸出轉換

- **查詢介面 (Query)**: 
  - 使用 Server Components 實現
  - 專注於數據檢索與展示
  - 只調用 Application 層的 QueryService
  - 不包含業務邏輯

- **命令介面 (Command)**:
  - 使用 Server Actions 實現
  - 專注於數據驗證與提交
  - 只調用 Application 層的 CommandService
  - 使用 Zod 驗證輸入

### 2. 應用層 (Application Layer)
**職責**：協調領域對象與服務，處理應用流程

- **查詢服務 (QueryService)**:
  - 協調資料查詢
  - 組合多個來源的數據
  - 轉換為 DTO (Data Transfer Object)
  - 不修改領域狀態

- **命令服務 (CommandService)**:
  - 協調領域操作
  - 管理交易邊界
  - 觸發領域事件處理
  - 確保原子性操作

### 3. 領域層 (Domain Layer)
**職責**：核心業務邏輯與規則，領域專家知識編碼

- **實體 (Entity)**:
  - 具有生命週期和唯一標識
  - 封裝業務規則與狀態
  - 保護不變性
  - 實現領域行為

- **值對象 (Value Object)**:
  - 無唯一標識
  - 不可變
  - 封裝業務屬性
  - 提供行為方法

- **聚合 (Aggregate)**:
  - 定義一致性邊界
  - 包含聚合根與子實體
  - 管理實體間關係
  - 確保業務規則

- **領域服務 (Domain Service)**:
  - 處理跨實體業務邏輯
  - 實現無法自然歸屬於單一實體的操作
  - 不持有狀態
  - 表達領域概念

- **領域事件 (Domain Event)**:
  - 記錄領域中發生的重要事情
  - 觸發後續流程
  - 實現領域間解耦
  - 支持事件溯源

### 4. 基礎設施層 (Infrastructure Layer)
**職責**：提供技術實現，支持上層架構

- **查詢儲存庫 (QueryRepository)**:
  - 實現高效查詢
  - 支持非規範化數據
  - 提供投影與聚合函數
  - 優化讀取性能

- **命令儲存庫 (CommandRepository)**:
  - 實現領域模型持久化
  - 管理實體生命週期
  - 支持原子性操作
  - 確保一致性規則

- **外部服務適配器 (External Service Adapters)**:
  - 集成外部系統
  - 轉換外部數據格式
  - 處理通信異常
  - 提供穩定介面

## CQRS 數據流詳解

### 查詢流程 (Query Path)
```
[用戶請求]
   ↓
[Server Component] → 展示數據，處理 UI 邏輯
   ↓
[QueryService] → 協調查詢，組合結果，轉換 DTO
   ↓
[QueryRepository] → 封裝查詢邏輯，優化性能
   ↓
[firebase-admin Read Model] → 執行數據庫操作
```

### 命令流程 (Command Path)
```
[用戶操作]
   ↓
[Server Action] → 驗證輸入，轉換為命令
   ↓
[CommandService] → 協調領域操作，管理交易，發布事件
   ↓
[Domain Model] → 實現業務邏輯，保護不變性
   ↓
[CommandRepository] → 持久化領域模型，確保一致性
   ↓
[firebase-admin Write Model] → 執行數據庫操作
   ↓
[Domain Event] → 觸發後續流程，更新讀模型
```

## 進階檔案結構

```
src/
├── modules/                              # 依業務模組組織代碼
│   ├── [module-name]/                    # 業務模組 (例：user, order)
│   │   ├── interfaces/                   # 介面層
│   │   │   ├── components/               # UI 組件
│   │   │   │   └── [component-name].tsx
│   │   │   ├── queries/                  # 查詢介面
│   │   │   │   └── [model]-[query].tsx
│   │   │   └── commands/                 # 命令介面
│   │   │       └── [model]-[command].ts
│   │   │
│   │   ├── application/                  # 應用層
│   │   │   ├── queries/                  # 查詢服務
│   │   │   │   ├── [model]-query.service.ts
│   │   │   │   └── dtos/                 # 數據傳輸對象
│   │   │   │       └── [model]-[dto].ts
│   │   │   └── commands/                 # 命令服務
│   │   │       ├── [model]-command.service.ts
│   │   │       └── dtos/
│   │   │           └── [model]-[dto].ts
│   │   │
│   │   ├── domain/                       # 領域層
│   │   │   ├── models/                   # 領域模型
│   │   │   │   ├── [model].entity.ts
│   │   │   │   ├── [model].value-object.ts
│   │   │   │   └── [model].aggregate.ts
│   │   │   ├── events/                   # 領域事件
│   │   │   │   ├── [model]-[event].event.ts
│   │   │   │   └── handlers/             # 事件處理器
│   │   │   │       └── [event]-handler.ts
│   │   │   ├── services/                 # 領域服務
│   │   │   │   └── [model]-domain.service.ts
│   │   │   ├── repositories/             # 領域儲存庫介面
│   │   │   │   └── [model]-repository.interface.ts
│   │   │   └── exceptions/               # 領域異常
│   │   │       └── [model]-exception.ts
│   │   │
│   │   └── infrastructure/               # 基礎設施層
│   │       ├── persistence/
│   │       │   ├── queries/              # 查詢儲存庫
│   │       │   │   └── [model]-query.repository.ts
│   │       │   └── commands/             # 命令儲存庫
│   │       │       └── [model]-command.repository.ts
│   │       ├── adapters/                 # 外部服務適配器
│   │       │   └── [service]-adapter.ts
│   │       └── mappers/                  # 數據映射器
│   │           └── [model]-mapper.ts
│   │
│   └── shared/                           # 共用模組
│       ├── domain/                       # 共用領域組件
│       │   ├── models/
│       │   │   └── base.entity.ts
│       │   └── events/
│       │       └── event-bus.ts
│       └── infrastructure/               # 共用基礎設施
│           ├── persistence/
│           │   └── firebase-admin/
│           │       └── client.ts
│           └── errors/
│               └── error-handler.ts
└── lib/                                  # 工具與輔助函數
    ├── hooks/                            # React Hooks
    ├── utils/                            # 通用工具函數
    └── types/                            # TypeScript 類型定義
```

## 命名與代碼規範

### 1. 命名規範
- **檔案命名**：
  - 界限明確：`[模組]-[領域]-[類型].[用途].[副檔名]`
  - 功能描述：`[動詞]-[名詞].[類型].[副檔名]`
  - 完整性：避免縮寫，使用完整詞彙
  - 一致性：在特定領域內保持一致術語

- **類型命名**：
  - 實體：`[Name]Entity`
  - 值對象：`[Name]ValueObject`
  - 聚合：`[Name]Aggregate`
  - 儲存庫：`[Name]Repository`
  - 服務：`[Name]Service`
  - 查詢：`[Name]Query`
  - 命令：`[Name]Command`
  - 事件：`[Name][Action]Event`

### 2. 代碼風格
- **職責單一**：每個類/函數只做一件事
- **小而精**：保持方法/函數短小精悍
- **無副作用**：盡量設計純函數
- **封裝變化**：隱藏實現細節
- **顯式勝於隱式**：明確表達意圖
- **測試優先**：設計時考慮可測試性

### 3. TypeScript 規範
- **嚴格類型**：啟用 `strict` 模式
- **無隱式 any**：禁用 `any` 類型
- **不可變性**：優先使用 `readonly` 和常量
- **類型別名**：使用 `type` 定義複雜類型
- **介面契約**：使用 `interface` 定義服務契約
- **訪問修飾符**：明確標記 `private`/`protected`/`public`

## CQRS 最佳實踐

### 1. 查詢模型設計
- **專用 DTO**：為每個查詢場景設計專用 DTO
- **投影查詢**：只選擇需要的欄位
- **預加載關聯**：減少 N+1 查詢問題
- **分頁優化**：支持游標與偏移分頁
- **快取策略**：適當位置實施快取
- **非規範化**：允許適度數據重複以提升性能
- **查詢優化**：設計索引支持主要查詢路徑

```typescript
// 查詢服務示例
export class UserQueryService {
  constructor(private readonly userQueryRepo: UserQueryRepository) {}

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    return this.userQueryRepo.getUserProfileById(userId);
  }

  async searchUsers(criteria: UserSearchCriteria): Promise<PaginatedResult<UserSummaryDto>> {
    return this.userQueryRepo.searchUsers(criteria);
  }
}
```

### 2. 命令模型設計
- **不可變命令**：命令一旦創建不可修改
- **命令驗證**：在命令處理前驗證
- **單一職責**：一個命令只做一件事
- **幂等性**：支持安全重試
- **原子性**：確保操作全部成功或全部失敗
- **事務管理**：明確定義事務邊界
- **審計追踪**：記錄命令執行歷史

```typescript
// 命令服務示例
export class UserCommandService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly eventBus: EventBus
  ) {}

  async registerUser(cmd: RegisterUserCommand): Promise<string> {
    // 驗證命令
    this.validateCommand(cmd);
    
    // 創建領域模型
    const user = UserAggregate.create({
      email: cmd.email,
      name: cmd.name,
      password: cmd.hashedPassword
    });
    
    // 持久化
    await this.userRepo.save(user);
    
    // 發布事件
    this.eventBus.publish(new UserRegisteredEvent(user.id, user.email));
    
    return user.id;
  }
}
```

### 3. 領域事件處理
- **事件總線**：實現集中式事件發布/訂閱
- **事件序列化**：支持事件持久化
- **事件處理器**：單一職責原則
- **最終一致性**：設計支持延遲處理
- **失敗處理**：實現事件重試機制
- **有序處理**：確保關鍵事件順序性
- **事件溯源**：考慮基於事件重建狀態

```typescript
// 領域事件與處理器示例
export class UserRegisteredEvent implements DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly occurredAt: Date = new Date()
  ) {}
}

export class SendWelcomeEmailHandler implements EventHandler<UserRegisteredEvent> {
  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.emailService.sendWelcomeEmail(event.email);
  }
}

export class UpdateUserStatisticsHandler implements EventHandler<UserRegisteredEvent> {
  constructor(private readonly statsRepo: StatisticsRepository) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.statsRepo.incrementUserCount();
  }
}
```

## 領域模型實踐

### 1. 實體設計
- **唯一標識**：提供穩定標識符
- **生命週期**：管理實體狀態變化
- **不變量**：確保業務規則
- **行為封裝**：方法表達領域能力
- **狀態保護**：防止非法狀態變更

```typescript
// 實體示例
export class UserEntity extends BaseEntity {
  private _email: EmailValueObject;
  private _name: NameValueObject;
  private _password: PasswordValueObject;
  private _status: UserStatus;
  
  private constructor(props: UserProps, id?: string) {
    super(id);
    this._email = props.email;
    this._name = props.name;
    this._password = props.password;
    this._status = props.status || UserStatus.PENDING;
  }
  
  // 工廠方法
  public static create(props: UserCreationProps, id?: string): UserEntity {
    // 驗證業務規則
    if (props.email.value === props.name.value) {
      throw new DomainException('Email cannot be the same as name');
    }
    
    return new UserEntity({
      ...props,
      password: PasswordValueObject.fromPlainText(props.password)
    }, id);
  }
  
  // 業務方法
  public activate(): void {
    if (this._status === UserStatus.ACTIVE) {
      throw new DomainException('User already active');
    }
    
    this._status = UserStatus.ACTIVE;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }
  
  // 值對象封裝
  get email(): string {
    return this._email.value;
  }
  
  // 其他方法與屬性...
}
```

### 2. 值對象設計
- **不可變性**：創建後不可修改
- **相等性**：基於屬性值比較
- **自驗證**：確保自身有效性
- **無副作用**：操作返回新實例
- **領域表達**：反映領域概念

```typescript
// 值對象示例
export class EmailValueObject {
  constructor(private readonly _value: string) {
    this.validate();
  }
  
  private validate(): void {
    if (!this.isValidEmail(this._value)) {
      throw new InvalidEmailException(this._value);
    }
  }
  
  private isValidEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: EmailValueObject): boolean {
    return this._value.toLowerCase() === other._value.toLowerCase();
  }
  
  // 其他方法...
}
```

### 3. 聚合設計
- **聚合根**：唯一對外訪問點
- **一致性邊界**：確保業務規則
- **交易邊界**：原子性操作單元
- **引用限制**：外部只能引用根實體
- **規模控制**：保持聚合精簡

```typescript
// 聚合示例
export class OrderAggregate extends AggregateRoot {
  private _orderItems: OrderItemEntity[] = [];
  private _status: OrderStatus;
  private _customerId: string;
  private _totalAmount: MoneyValueObject;
  
  private constructor(props: OrderProps, id?: string) {
    super(id);
    this._customerId = props.customerId;
    this._status = props.status || OrderStatus.DRAFT;
    this._totalAmount = props.totalAmount || MoneyValueObject.zero();
  }
  
  // 工廠方法
  public static create(props: OrderCreationProps, id?: string): OrderAggregate {
    return new OrderAggregate(props, id);
  }
  
  // 聚合方法
  public addItem(item: OrderItemProps): void {
    if (this._status !== OrderStatus.DRAFT) {
      throw new OrderModificationException('Cannot modify a confirmed order');
    }
    
    const orderItem = OrderItemEntity.create(item, this.id);
    this._orderItems.push(orderItem);
    this.recalculateTotal();
    
    this.addDomainEvent(new OrderItemAddedEvent(this.id, orderItem.id));
  }
  
  public confirm(): void {
    if (this._orderItems.length === 0) {
      throw new OrderValidationException('Cannot confirm empty order');
    }
    
    if (this._status !== OrderStatus.DRAFT) {
      throw new OrderStatusException('Only draft orders can be confirmed');
    }
    
    this._status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmedEvent(this.id, this._customerId, this._totalAmount));
  }
  
  private recalculateTotal(): void {
    this._totalAmount = this._orderItems.reduce(
      (sum, item) => sum.add(item.subTotal),
      MoneyValueObject.zero()
    );
  }
  
  // 其他方法與屬性...
}
```

### 4. 儲存庫設計
- **集合抽象**：提供類似集合的介面
- **持久化細節隱藏**：不暴露數據庫細節
- **聚合生命週期**：管理整個聚合的持久化
- **查詢規範**：支持複雜查詢條件
- **單元工作**：協調多聚合事務

```typescript
// 儲存庫介面
export interface OrderRepository {
  findById(id: string): Promise<OrderAggregate | null>;
  findByCustomerId(customerId: string): Promise<OrderAggregate[]>;
  save(order: OrderAggregate): Promise<void>;
  delete(order: OrderAggregate): Promise<void>;
}

// 儲存庫實現
export class firebase-adminOrderRepository implements OrderRepository {
  constructor(private readonly firebase-admin: firebase-adminClient) {}
  
  async findById(id: string): Promise<OrderAggregate | null> {
    const orderData = await this.firebase-admin.order.findUnique({
      where: { id },
      include: { 
        items: true 
      }
    });
    
    if (!orderData) return null;
    
    return this.mapToDomain(orderData);
  }
  
  async save(order: OrderAggregate): Promise<void> {
    const { rawData, events } = order.extractStateAndEvents();
    
    // 實現原子性操作
    await this.firebase-admin.$transaction(async (tx) => {
      // 保存聚合根
      await tx.order.upsert({
        where: { id: rawData.id },
        update: this.mapToDatabase(rawData),
        create: this.mapToDatabase(rawData)
      });
      
      // 保存子實體
      for (const item of rawData.items) {
        await tx.orderItem.upsert({
          where: { id: item.id },
          update: this.mapItemToDatabase(item),
          create: this.mapItemToDatabase(item)
        });
      }
      
      // 處理刪除的項目...
    });
    
    // 發布領域事件
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
  
  // 其他方法與映射邏輯...
}
```

## 高級 CQRS 模式

### 1. 事件溯源 (Event Sourcing)
使用事件序列作為真相來源，而非當前狀態

```typescript
// 事件溯源聚合基類
export abstract class EventSourcedAggregate {
  private _events: DomainEvent[] = [];
  private _version: number = 0;
  
  protected abstract applyEvent(event: DomainEvent): void;
  
  protected addEvent(event: DomainEvent): void {
    this._events.push(event);
    this.applyEvent(event);
  }
  
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._events];
  }
  
  public clearEvents(): void {
    this._events = [];
  }
  
  public loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.applyEvent(event);
      this._version++;
    }
  }
  
  get version(): number {
    return this._version;
  }
}

// 使用事件溯源的聚合
export class EventSourcedOrderAggregate extends EventSourcedAggregate {
  private _id: string;
  private _customerId: string;
  private _items: OrderItemData[] = [];
  private _status: OrderStatus = OrderStatus.DRAFT;
  
  constructor(id: string) {
    super();
    this._id = id;
  }
  
  // 命令方法
  public createOrder(customerId: string): void {
    this.addEvent(new OrderCreatedEvent(this._id, customerId));
  }
  
  public addItem(item: OrderItemData): void {
    this.addEvent(new OrderItemAddedEvent(this._id, item));
  }
  
  public confirmOrder(): void {
    this.addEvent(new OrderConfirmedEvent(this._id));
  }
  
  // 事件應用方法
  protected applyEvent(event: DomainEvent): void {
    if (event instanceof OrderCreatedEvent) {
      this._customerId = event.customerId;
    } else if (event instanceof OrderItemAddedEvent) {
      this._items.push(event.item);
    } else if (event instanceof OrderConfirmedEvent) {
      this._status = OrderStatus.CONFIRMED;
    }
  }
  
  // 查詢方法
  get id(): string { return this._id; }
  get customerId(): string { return this._customerId; }
  get items(): OrderItemData[] { return [...this._items]; }
  get status(): OrderStatus { return this._status; }
}
```

### 2. 任務調度 (Task Scheduling)
處理長時間運行的流程與延遲操作

```typescript
// 任務調度服務
export class TaskScheduler {
  constructor(private readonly taskRepository: TaskRepository) {}
  
  async scheduleTask(task: Task): Promise<void> {
    await this.taskRepository.save(task);
  }
  
  async processDueTasks(): Promise<void> {
    const dueTasks = await this.taskRepository.findDueTasks();
    
    for (const task of dueTasks) {
      await this.processTask(task);
    }
  }
  
  private async processTask(task: Task): Promise<void> {
    try {
      await task.execute();
      await this.taskRepository.markAsCompleted(task.id);
    } catch (error) {
      if (task.canRetry()) {
        await this.taskRepository.incrementRetries(task.id);
      } else {
        await this.taskRepository.markAsFailed(task.id, error);
      }
    }
  }
}

// 定義任務
export class SendWelcomeEmailTask implements Task {
  constructor(
    public readonly id: string,
    private readonly userId: string,
    private readonly emailService: EmailService,
    private readonly retries: number = 0
  ) {}
  
  async execute(): Promise<void> {
    const user = await this.userRepository.findById(this.userId);
    if (!user) throw new TaskFailedException('User not found');
    
    await this.emailService.sendWelcomeEmail(user.email);
  }
  
  canRetry(): boolean {
    return this.retries < 3;
  }
}
```

### 3. 快取策略 (Caching Strategy)
優化查詢性能與減少資料庫負載

```typescript
// 快取裝飾器
export class CachedUserQueryRepository implements UserQueryRepository {
  constructor(
    private readonly repository: UserQueryRepository,
    private readonly cache: CacheService
  ) {}
  
  async getUserById(id: string): Promise<UserDto | null> {
    const cacheKey = `user:${id}`;
    
    // 嘗試從快取獲取
    const cached = await this.cache.get<UserDto>(cacheKey);
    if (cached) return cached;
    
    // 從儲存庫獲取
    const user = await this.repository.getUserById(id);
    
    // 存入快取
    if (user) {
      await this.cache.set(cacheKey, user, 3600); // 1小時過期
    }
    
    return user;
  }
  
  // 實現使快取失效的方法
  async invalidateUser(id: string): Promise<void> {
    await this.cache.delete(`user:${id}`);
  }
  
  // 其他方法...
}

// 註冊快取失效監聽器
export class UserCacheInvalidator implements EventHandler<UserUpdatedEvent> {
  constructor(private readonly cachedRepo: CachedUserQueryRepository) {}
  
  async handle(event: UserUpdatedEvent): Promise<void> {
    await this.cachedRepo.invalidateUser(event.userId);
  }
}
```

### 4. 讀寫分離 (Read-Write Separation)
物理分離查詢與命令數據存儲

```typescript
import { firestore } from 'firebase-admin';

// 初始化 Firestore 示例
export const initializeFirestore = () => {
  if (!firestore) {
    throw new Error('Firestore has not been initialized. Please initialize firebase-admin.');
  }
  return firestore();
};

// 寫入數據示例
export async function writeData(collection: string, docId: string, data: any): Promise<void> {
  const docRef = firestore().collection(collection).doc(docId);
  await docRef.set(data);
}

// 讀取數據示例
export async function readData(collection: string, docId: string): Promise<any | null> {
  const docRef = firestore().collection(collection).doc(docId);
  const doc = await docRef.get();
  return doc.exists ? doc.data() : null;
}

// 查詢數據示例
export async function queryData(collection: string, field: string, value: any): Promise<any[]> {
  const querySnapshot = await firestore().collection(collection).where(field, '==', value).get();
  return querySnapshot.docs.map(doc => doc.data());
}
```

## 數據庫選擇與實現

### 前端數據庫：Firebase
在前端應用中，使用 Firebase 提供的實時數據庫和 Firestore 作為數據存儲解決方案。
請將此邏輯封裝在 `src/modules/shared/infrastructure/persistence/firebase/client.ts`。

```typescript
// src/modules/shared/infrastructure/persistence/firebase/client.ts
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// 初始化 Firebase 應用
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 寫入數據
export async function writeData(collection: string, docId: string, data: any): Promise<void> {
  const docRef = doc(db, collection, docId);
  await setDoc(docRef, data);
}

// 讀取數據
export async function readData(collection: string, docId: string): Promise<any | null> {
  const docRef = doc(db, collection, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}
```

### 後端數據庫：Firebase Admin SDK
在後端應用中，使用 Firebase Admin SDK 提供的 Firestore 作為數據存儲解決方案。
請將此邏輯封裝在 `src/modules/shared/infrastructure/persistence/firebase-admin/client.ts`。

```typescript
// src/modules/shared/infrastructure/persistence/firebase-admin/client.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 初始化 Firebase Admin
const serviceAccount = require('path/to/serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// 寫入數據
export async function writeData(collection: string, docId: string, data: any): Promise<void> {
  const docRef = db.collection(collection).doc(docId);
  await docRef.set(data);
}

// 讀取數據
export async function readData(collection: string, docId: string): Promise<any | null> {
  const docRef = db.collection(collection).doc(docId);
  const doc = await docRef.get();
  return doc.exists ? doc.data() : null;
}

// 查詢數據
export async function queryData(collection: string, field: string, value: any): Promise<any[]> {
  const querySnapshot = await db.collection(collection).where(field, '==', value).get();
  return querySnapshot.docs.map(doc => doc.data());
}
```