// Wallet 查詢服務，CQRS 查詢模型
import { WalletAggregate } from '@/modules/wallet/domain/models/wallet.aggregate';
import { WalletRepository } from '@/modules/wallet/domain/repositories/wallet-repository.interface';

export class WalletQueryService {
    constructor(private readonly walletRepo: WalletRepository) { }

    async getWalletByUserId(userId: string): Promise<WalletAggregate | null> {
        return this.walletRepo.findByUserId(userId);
    }
}
