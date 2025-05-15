// WalletRepository 介面，符合 DDD 儲存庫設計
import { WalletAggregate } from '../models/wallet.aggregate';

export interface WalletRepository {
    findByUserId(userId: string): Promise<WalletAggregate | null>;
    save(wallet: WalletAggregate): Promise<void>;
}
