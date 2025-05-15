
export function LineBotWebhookPage() {
  // 純展示元件，webhook 處理邏輯通過 Server Action 進行
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">LINE Bot Webhook Endpoint</h1>
      <p>此頁面用於接收 LINE 平台的 webhook 請求。</p>
      <p>請將此 URL 設定為 LINE Developer Console 中的 Webhook URL。</p>
    </div>
  );
}
