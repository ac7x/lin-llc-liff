export interface WorkAsset {
    assetID: string; // 唯一識別碼
    description: string; // 資產描述
    amount: number; // 金額，表示薪資或資產的金額
    currency: string; // 貨幣，例如 "TWD"
    coin: number; // 用戶擁有的虛擬硬幣數量
    diamond: number; // 用戶擁有的虛擬鑽石數量
}
