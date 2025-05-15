// FirebaseWalletRepository，調用 shared firebase-admin
import { getFirestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase/firebase-admin';
import { WalletAggregate } from '@/modules/wallet/domain/models/wallet.aggregate';
import { WalletRepository } from '@/modules/wallet/domain/repositories/wallet-repository.interface';

export class FirebaseWalletRepository implements WalletRepository {
    private db = getFirestoreAdmin();

    async findByUserId(userId: string): Promise<WalletAggregate | null> {
        const doc = await this.db.collection('wallets').doc(userId).get();
        if (!doc.exists) return null;
        const data = doc.data();
        if (!data) return null;
        return WalletAggregate.create({
            userId: data.userId,
            balance: data.balance,
        });
    }

    async save(wallet: WalletAggregate): Promise<void> {
        await this.db.collection('wallets').doc(wallet.userId).set({
            userId: wallet.userId,
            balance: wallet.balance,
        });
    }
}
