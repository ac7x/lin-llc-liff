'use client';

interface RechargeFormProps {
  amount: string;
  setAmount: (value: string) => void;
  isLoading: boolean;
  error?: string;
  onSubmit: (e: React.FormEvent) => void;
}

export function RechargeForm({ 
  amount, 
  setAmount, 
  isLoading, 
  error, 
  onSubmit 
}: RechargeFormProps) {
  return (
    <div>
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {[100, 300, 500, 1000, 2000, 5000].map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value.toString())}
              className={`p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center ${
                parseInt(amount || '0') === value ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <span className="text-2xl font-bold text-blue-500">{value}</span>
              <span className="text-gray-600">鑽石</span>
              <span className="text-sm text-gray-400">NT$ {value}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 border rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自訂金額
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">NT$</span>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="請輸入充值金額"
              min="1"
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            充值金額 = 獲得鑽石數量
          </p>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      <button
        onClick={onSubmit}
        disabled={isLoading || !amount || parseInt(amount) < 1}
        className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isLoading ? '處理中...' : `確認充值 ${amount || 0} 鑽石`}
      </button>
    </div>
  );
}
