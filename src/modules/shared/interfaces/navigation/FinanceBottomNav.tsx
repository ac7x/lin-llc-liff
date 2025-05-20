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
    {
        href: '/management/work-asset',
        icon: '🏗️',
        label: '資產管理',
        active: false
    },
    {
        href: '/finance/dashboard',
        icon: '💰',
        label: '財務總覽',
        active: false
    },
    {
        href: '/finance/invoice',
        icon: '🧾',
        label: '發票管理',
        active: false
    },
    {
        href: '/finance/report',
        icon: '📈',
        label: '報表',
        active: false
    }
];

export function FinanceBottomNav({ items = defaultFinanceNavItems }: FinanceBottomNavProps) {
    const pathname = usePathname();

    const navItems = (items && items.length > 0 ? items : defaultFinanceNavItems).map(item => ({
        ...item,
        active: pathname === item.href
    }));

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-[var(--background)] border-t border-gray-200 font-sans">
            <div className="flex h-full mx-auto justify-center">
                {navItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={`flex-1 inline-flex flex-col items-center justify-center px-5 max-w-[120px] ${item.active ? 'text-[#00B900]' : 'text-gray-500 hover:text-[#00B900]'}`}
                    >
                        <div className="text-2xl">{item.icon}</div>
                        <span className="text-xs">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}