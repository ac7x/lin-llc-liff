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

interface ManagementBottomNavProps {
    items?: NavItem[];
}

const defaultAdminNavItems: NavItem[] = [
    { href: '/management/dashboard', icon: '📊', label: '儀表板', active: false },
    { href: '/management/work-schedule', icon: '📅', label: '工作行程', active: false },
    { href: '/management/work-schedule-admin', icon: '📅', label: '排程後端', active: false },
    { href: '/management/work-skill', icon: '🛠️', label: '技能管理', active: false },
    { href: '/management/work-task', icon: '📝', label: '工作任務', active: false },
    { href: '/management/work-epic', icon: '📖', label: '工作史詩', active: false },
    { href: '/management/work-template', icon: '📂', label: '工作範本', active: false },
    { href: '/management/work-member', icon: '👥', label: '成員管理', active: false }
];

export function ManagementBottomNav({ items = defaultAdminNavItems }: ManagementBottomNavProps) {
    const pathname = usePathname();

    const navItems = (items && items.length > 0 ? items : defaultAdminNavItems).map(item => ({
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
            <div className="flex h-full mx-auto justify-center overflow-x-auto">
                {navItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={`
                            flex-1 min-w-0 inline-flex flex-col items-center justify-center
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