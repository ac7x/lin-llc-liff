# Firebase Security Rules 設置指南

為了讓 Firebase 客戶端測試寫入功能正常工作，您需要更新 Firebase Security Rules。以下是建議的 Firestore 安全規則設定：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 默認規則 - 拒絕所有訪問
    match /{document=**} {
      allow read, write: if false;
    }
    
    // 僅限管理員使用的測試集合
    match /test/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // 允許已認證用戶寫入的客戶端測試集合
    match /test_client_writes/{docId} {
      // 允許已認證用戶寫入，並且只能寫入自己的數據
      allow create: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
                     
      // 允許讀取自己創建的數據
      allow read: if request.auth != null && 
                   resource.data.userId == request.auth.uid;
                   
      // 管理員可以讀取所有數據
      allow read: if request.auth != null && request.auth.token.admin == true;
    }
    
    // 其他集合規則...
  }
}
```

## 設定步驟

1. 在 Firebase 控制台中打開您的項目
2. 點擊左側導航欄中的 "Firestore Database"
3. 點擊 "Rules" 標簽
4. 複製並貼上上面的規則，根據需要進行調整
5. 點擊 "Publish" 發布規則

## 注意事項

- 這些規則實施了最小權限原則，只允許用戶訪問他們自己的數據
- `test_client_writes` 集合專門設計用於客戶端寫入測試
- 用戶必須經過身份驗證才能寫入數據
- 用戶只能讀取自己創建的文檔
- 後續實際應用中，您需要根據實際業務需求調整這些規則
