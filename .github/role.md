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

### WorkTask[工作任務］
定義：某個 WorkFlow 的具體任務，包含應完成的數量
- `TaskID` (唯一識別碼)
- `FlowID` (關聯的 WorkFlow)
- `TargetQuantity` (應完成數量)
- `CompletedQuantity`（已完成數量）
- `Unit` (單位)
- `Status` (狀態)：`待分配`/`執行中`/`已完成`  
- `PlannedStartDate` (計劃開始日期)
- `PlannedEndDate` (計劃結束日期)
- `Progress` (進度)：以百分比表示（例如 0-100）

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

### workSkill［工作技能］  
定義：描述工作人員的技能及其熟練程度。
- `SkillID` (唯一識別碼)
- `Name` (技能名稱)：如 "焊接"、"電器"
- `Description` (技能描述)：技能的詳細說明
- `Category` (技能類別)：如 "技術"、"管理"
- `Level` (技能等級)：整數值，表示熟練程度（如 1-10）
- `IsMandatory` (是否必須)：是否為某些工作類型的必備技能

### workLevel［工作等級］  
定義：描述工作人員或工作的等級，類似於遊戲中的等級系統，用於區分責任範圍或技能要求。工作人員可透過完成任務獲得經驗值，進而升級。等級範圍為 1 至 60 級。
- `LevelID` (唯一識別碼)
- `Title` (等級)：顯示等級
- `ExperiencePoints` (經驗值)：類似遊戲中的經驗值，用於升級
- `NextLevelThreshold` (下一等級門檻)：升級所需的經驗值
- `Rewards` (升級獎勵)：升級後可獲得的獎勵，例如加薪或新技能解鎖
- `MaxLevel` (最高等級)：固定為 60 級

### workAsset［工作薪資］  
定義：描述與工作相關的薪資或資產資訊，並顯示用戶資產（如 `coin` 和 `diamond`）。
- `AssetID` (唯一識別碼)
- `Description` (資產描述)：資產的詳細說明
- `Amount` (金額)：數值，表示薪資或資產的金額
- `Currency` (貨幣)：如 "TWD"
- `Coin` (硬幣)：用戶擁有的虛擬硬幣數量
- `Diamond` (鑽石)：用戶擁有的虛擬鑽石數量

### **關聯與補充說明**
1. **階層關係**：  
   `WorkEpic → WorkType → WorkFlow → WorkItem → WorkTask → WorkLoad`  

2. **狀態流轉**：  
   - 每個層級的狀態需連動（例如 WorkItem 完成後，檢查是否所有 Steps 均完成）。  
   - 可加入 `BlockedReason` 欄位標記阻塞原因。