// Wallet 命令服務，CQRS 命令模型
import { WalletRepository } from '@/modules/wallet/domain/repositories/wallet-repository.interface';

export class WalletCommandService {
    constructor(private readonly walletRepo: WalletRepository) { }

    async deposit(userId: string, amount: number): Promise<void> {
        const wallet = await this.walletRepo.findByUserId(userId);
        if (!wallet) throw new Error('Wallet not found');
        wallet.deposit(amount);
        await this.walletRepo.save(wallet);
    }

    async withdraw(userId: string, amount: number): Promise<void> {
        const wallet = await this.walletRepo.findByUserId(userId);
        if (!wallet) throw new Error('Wallet not found');
        wallet.withdraw(amount);
        await this.walletRepo.save(wallet);
    }
}
