### WorkEpic[工作標的］
定義：整體工作目標或專案標的。
- `EpicID` (唯一識別碼)
- `Title` (標題)
- `StartDate` (預計開始時間)
- `EndDate` (預計結束時間)
- `InsuranceStatus` (保險狀態)：無/有［日期］  
- `Owner` (負責人)：人員
- `Status` (狀態)：`待開始`/`進行中`/`已完成`/`已取消`  
- `Priority` (優先級)：數字愈低愈優先（從0）
- `location` (地點)

### WorkType[工作種類］
定義：WorkEpic 中的分類或枚舉，代表不同類型的工作。
- `TypeID` (唯一識別碼)
- `Title` (標題)
- `DefaultWorkflow` (預設關聯的 WorkFlow)  
- `RequiredSkills` (所需技能)

### WorkFlow [工作流程］
定義：針對每個 WorkType 定義的工作步驟序列（枚舉）
- `FlowID` (唯一識別碼)
- `WorkTypeID` (關聯的 WorkType)  
- `Steps` (步驟列表)
- `StepName` (步驟名稱)
- `Order` (順序)：整數值（從 1 開始）  
- `RequiredSkills` (所需技能)

### WorkItem[工作項目］
定義：WorkFlow 中具體的其中一個步驟
- `ItemID` (唯一識別碼)
- `EpicID` (關聯的 WorkEpic)  
- `FlowID` (關聯的 WorkFlow)  
- `CurrentStep` (當前步驟)：引用 WorkFlow.Steps  
- `AssignedTo` (指派對象)  
- `Status` (狀態)：`未開始`/`進行中`/`已完成`/`阻塞中`  

### WorkTask[工作任務］
定義：某個 WorkItem 的具體任務，包含應完成的數量
- `TaskID` (唯一識別碼)
- `ItemID` (關聯的 WorkItem)  
- `TargetQuantity` (應完成數量)
- `CompletedQuantity`（已完成數量）
- `Unit` (單位)
- `Status` (狀態)：`待分配`/`執行中`/`已完成`  

### WorkLoad［工作量］  
定義：WorkTask 的拆分工作量，拆分成不同日期與數量。

- `LoadID` (唯一識別碼)
- `TaskID` (關聯的 WorkTask)  
- `Executor` (執行人)：對應 WorkMember.MemberID  
- `PlannedQuantity` (計畫完成量)  
- `ActualQuantity` (實際完成量)  
- `Unit` (單位)  
- `Notes` (備註)：記錄異常或說明  
- `PlannedStartTime` (計劃開始時間)
- `PlannedEndTime` (計劃結束時間)
---

### WorkMember［工作人員］  
定義：系統中所有可被指派工作的人，包括內部員工與外包人員。資料從 userID 延伸而來，並包含技能、可用狀態等作業屬性。

- `MemberID` (唯一識別碼，對應 User 帳號 ID)
- `Name` (姓名，可與 Auth 中 displayName 同步)
- `Role` (人員角色)：如 技術員 / 工人 / 現場主管 / 監工 等
- `Skills` (技能列表)：字串陣列，例如 ["焊接", "電器"]
- `Availability` (可用狀態)：`空閒` / `忙碌` / `請假` / `離線` 等
- `AssignedEpicIDs` (關聯的 WorkEpic ID 列表，可選)
- `ContactInfo` (聯絡資訊)：如 email、電話、LINE ID 等（結構可彈性）
- `Status` (身分狀態)：`在職` / `離職` / `暫停合作` / `黑名單`
- `IsActive` (帳號是否啟用中)：對應 Firebase Auth enable 狀態
- `LastActiveTime` (最後登入或作業時間)：可用於排班與提醒）
- `Skills.Level` 
- `SkillScore` 
- `TaskCompletionRate` 

### **關聯與補充說明**
1. **階層關係**：  
   `WorkEpic → WorkType → WorkFlow → WorkItem → WorkTask → WorkLoad`  

2. **狀態流轉**：  
   - 每個層級的狀態需連動（例如 WorkItem 完成後，檢查是否所有 Steps 均完成）。  
   - 可加入 `BlockedReason` 欄位標記阻塞原因。  