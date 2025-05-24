'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface NavItem {
    href: string;
    icon: ReactNode;
    label: string;
    active: boolean;
    popoverLinks?: { label: string; href: string }[];
}

interface ManagementBottomNavProps {
    items?: NavItem[];
}

const defaultAdminNavItems: NavItem[] = [
    {
        href: '/management/schedule-module',
        icon: '📆',
        label: '日程',
        active: false,
        popoverLinks: [
            { label: '排程客戶', href: '/management/schedule-module/customer' },
            { label: '排程後端', href: '/management/schedule-module/backend' },
            { label: '儀表板', href: '/management/schedule-module/dashboard' },
        ],
    },
    {
        href: '/management/work-module',
        icon: '🗂️',
        label: '工作模組',
        active: false,
        popoverLinks: [
            { label: '工作任務', href: '/management/work-module/task' },
            { label: '工作史詩', href: '/management/work-module/epic' },
            { label: '工作範本', href: '/management/work-module/template' },
        ],
    },
    {
        href: '/management/member-management',
        icon: '👤',
        label: '成員管理',
        active: false,
        popoverLinks: [
            { label: '技能管理', href: '/management/member-management/skills' },
            { label: '成員列表', href: '/management/member-management/list' },
        ],
    },
];

export function ManagementBottomNav({ items = defaultAdminNavItems }: ManagementBottomNavProps) {
    const pathname = usePathname();
    const [activePopover, setActivePopover] = useState<string | null>(null);

    // Popover refs
    const popoverRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const btnRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

    // 點擊外部收起 popover
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            let shouldClose = true;
            Object.keys(popoverRefs.current).forEach(key => {
                if (
                    (btnRefs.current[key] && btnRefs.current[key]!.contains(target)) ||
                    (popoverRefs.current[key] && popoverRefs.current[key]!.contains(target))
                ) {
                    shouldClose = false;
                }
            });
            if (shouldClose) setActivePopover(null);
        };
        if (activePopover) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [activePopover]);

    const navItems = (items && items.length > 0 ? items : defaultAdminNavItems).map(item => ({
        ...item,
        active: pathname === item.href,
    }));

    return (
        <nav
            className="
                fixed bottom-0 left-0 z-50 w-full
                h-16 bg-[var(--background,white)] border-t border-gray-200 font-sans
                px-safe pb-safe
            "
            style={{
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            <div className="flex h-full mx-auto justify-center items-center overflow-x-visible w-full">
                {navItems.map((item, index) => {
                    const hasPopover = !!item.popoverLinks;
                    const popKey = `${item.label}-${index}`;
                    return (
                        <div key={index} className="relative flex-1 min-w-0 flex flex-col items-center justify-end h-full">
                            {hasPopover && activePopover === popKey && (
                                <div
                                    ref={el => { popoverRefs.current[popKey] = el; }} // 修正：不回傳值
                                    className="fixed left-1/2 transform -translate-x-1/2 bg-[var(--background,white)] border rounded-lg shadow-lg px-4 py-2 flex flex-col items-center z-50"
                                    style={{
                                        minWidth: 'max-content',
                                        bottom: 'calc(env(safe-area-inset-bottom) + 4rem)',
                                    }}
                                >
                                    {item.popoverLinks!.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.href}
                                            className="px-4 py-2 text-gray-700 hover:text-[#00B900] hover:bg-gray-100 w-full text-center rounded transition"
                                            onClick={() => setActivePopover(null)}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <a
                                href="#"
                                ref={el => { btnRefs.current[popKey] = el; }} // 修正：不回傳值
                                onClick={e => {
                                    e.preventDefault();
                                    setActivePopover(activePopover === popKey ? null : popKey);
                                }}
                                className={`
                                    flex w-full min-w-0 flex-col items-center justify-center h-full
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
                                <span className="text-[11px] sm:text-xs truncate block">{item.label}</span>
                            </a>
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}