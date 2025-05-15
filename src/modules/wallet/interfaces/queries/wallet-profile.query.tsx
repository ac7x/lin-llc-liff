// Wallet 查詢介面，Server Component
import { WalletQueryService } from '@/modules/wallet/application/queries/wallet-query.service';
import { FirebaseWalletRepository } from '@/modules/wallet/infrastructure/repositories/wallet-repository';

export async function WalletProfile({ userId }: { userId: string }) {
    const walletRepo = new FirebaseWalletRepository();
    const walletQueryService = new WalletQueryService(walletRepo);
    const wallet = await walletQueryService.getWalletByUserId(userId);

    if (!wallet) return <div>無錢包資料</div>;

    return (
        <div>
            <h3>資產餘額</h3>
            <p>{wallet.balance} 元</p>
        </div>
    );
}
