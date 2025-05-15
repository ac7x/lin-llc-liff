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
        const walletsCollection = this.db.collection('wallets');
        const snapshot = await walletsCollection.limit(1).get();
        if (snapshot.empty) {
            // 集合尚未存在，先寫入一個初始化文件
            await walletsCollection.doc('__init__').set({ initialized: true });
        }
        await walletsCollection.doc(wallet.userId).set({
            userId: wallet.userId,
            balance: wallet.balance,
        });
    }
}
