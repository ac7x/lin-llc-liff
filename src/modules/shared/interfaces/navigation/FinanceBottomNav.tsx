'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavItem {
    href: string;
    icon: ReactNode;
    label: string;
    active: boolean;
}

interface FinanceBottomNavProps {
    items?: NavItem[];
}

const defaultFinanceNavItems: NavItem[] = [
    { href: '/finance/work-asset', icon: '🏗️', label: '資產管理', active: false },
    { href: '/finance/dashboard', icon: '💰', label: '財務總覽', active: false },
    { href: '/finance/invoice', icon: '🧾', label: '發票管理', active: false },
    { href: '/finance/report', icon: '📈', label: '報表', active: false }
];

export function FinanceBottomNav({ items = defaultFinanceNavItems }: FinanceBottomNavProps) {
    const pathname = usePathname();

    // 設 NavItem 如果沒有提供
    const navItems = (items && items.length > 0 ? items : defaultFinanceNavItems).map(item => ({
        ...item,
        active: pathname === item.href
    }));

    return (
        <nav
            className="
                fixed bottom-0 left-0 z-50 w-full
                h-16 bg-[var(--background,white)] border-t border-gray-200 font-sans
                px-safe pb-safe
            "
            style={{
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <div className="flex h-full mx-auto justify-center items-center overflow-x-visible w-full">
                {navItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={`
                            flex-1 min-w-0 inline-flex flex-col items-center justify-center h-full
                            px-2 sm:px-5 max-w-[120px]
                            ${item.active
                                ? 'text-[#00B900] font-semibold border-t-2 border-[#00B900] bg-green-50'
                                : 'text-gray-500 hover:text-[#00B900]'
                            }
                            transition-colors duration-150
                        `}
                        style={{ minWidth: '76px' }}
                    >
                        <div className="text-xl sm:text-2xl">{item.icon}</div>
                        <span className="text-[11px] sm:text-xs truncate block">
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}