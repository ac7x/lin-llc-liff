import FirebaseAdminTestButton from './firebase-admin-test-button';
import FirebaseClientTestButton from './firebase-client-test-button';

/**
 * Firebase 測試面板
 * 整合了 Firebase Admin 和 Firebase Client 的測試功能
 */
export default function FirebaseTestPanel() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-4">
      <h2 className="text-xl font-bold mb-4">Firebase 數據寫入測試</h2>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Firebase Admin 測試區塊 */}
        <div className="border rounded p-4">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">
            伺服器端 (Firebase Admin SDK)
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            使用 Server Actions 經由 Firebase Admin SDK 在伺服器端寫入數據。
          </p>
          <FirebaseAdminTestButton />
        </div>
        
        {/* Firebase Client 測試區塊 */}
        <div className="border rounded p-4">
          <h3 className="text-lg font-semibold mb-3 text-amber-700">
            客戶端 (Firebase Client SDK)
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            直接在瀏覽器使用 Firebase Client SDK 寫入數據。
          </p>
          <FirebaseClientTestButton />
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>💡 測試注意事項：</p>
        <ul className="list-disc pl-5 mt-1">
          <li>所有測試數據會寫入到 <code>test</code> 集合</li>
          <li>檢查 Firebase Console 確認數據是否成功寫入</li>
          <li>Client SDK 需要配置 Firebase 安全規則允許寫入</li>
        </ul>
      </div>
    </div>
  );
}
