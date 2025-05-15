interface AssetDisplayProps {
  assets: {
    diamonds: number;
    hearts: number;
    bubbles: number;
    coins: number;
  };
}

export function AssetDisplay({ assets }: AssetDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-blue-50">
          <div className="text-2xl font-bold text-blue-500">{assets.diamonds}</div>
          <div className="text-gray-600">鑽石</div>
        </div>
        
        <div className="p-4 border rounded-lg bg-red-50">
          <div className="text-2xl font-bold text-red-500">{assets.hearts}</div>
          <div className="text-gray-600">愛心</div>
        </div>
        
        <div className="p-4 border rounded-lg bg-purple-50">
          <div className="text-2xl font-bold text-purple-500">{assets.bubbles}</div>
          <div className="text-gray-600">泡泡</div>
        </div>
        
        <div className="p-4 border rounded-lg bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-500">{assets.coins}</div>
          <div className="text-gray-600">金幣</div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p>• 資產實時更新</p>
        <p>• 充值後立即到帳</p>
        <p>• 如有問題請聯繫客服</p>
      </div>
    </div>
  );
}
