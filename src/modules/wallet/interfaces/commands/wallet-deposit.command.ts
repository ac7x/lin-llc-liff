// Wallet 存款命令介面，Server Action
import { WalletCommandService } from '@/modules/wallet/application/commands/wallet-command.service';
import { FirebaseWalletRepository } from '@/modules/wallet/infrastructure/repositories/wallet-repository';

export async function depositToWallet(userId: string, amount: number) {
    const walletRepo = new FirebaseWalletRepository();
    const walletCommandService = new WalletCommandService(walletRepo);
    await walletCommandService.deposit(userId, amount);
}
