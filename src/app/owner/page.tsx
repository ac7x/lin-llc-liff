// src/app/finance/page.tsx
import { FinanceBottomNav } from '@/modules/shared/interfaces/navigation/finance-bottom-nav';

export default function FinancePage() {
    return (
        <div className="p-4 pb-20 bg-background text-foreground min-h-screen text-center">
            <h1 className="text-2xl font-bold">Finance Page</h1>
            <p>Welcome to the finance section.</p>
            <FinanceBottomNav />
        </div>
    );
}
