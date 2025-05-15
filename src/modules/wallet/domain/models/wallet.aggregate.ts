// Wallet 聚合根，符合 DDD 聚合設計

export interface WalletProps {
    userId: string;
    balance: number;
}

export class WalletAggregate {
    private readonly _userId: string;
    private _balance: number;

    private constructor(props: WalletProps) {
        this._userId = props.userId;
        this._balance = props.balance;
    }

    static create(props: WalletProps): WalletAggregate {
        // 可加業務規則驗證
        return new WalletAggregate(props);
    }

    get userId(): string {
        return this._userId;
    }

    get balance(): number {
        return this._balance;
    }

    public deposit(amount: number): void {
        if (amount <= 0) throw new Error('存入金額需大於 0');
        this._balance += amount;
    }

    public withdraw(amount: number): void {
        if (amount > this._balance) throw new Error('餘額不足');
        this._balance -= amount;
    }
}
