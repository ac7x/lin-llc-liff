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

interface GlobalBottomNavProps {
  items?: NavItem[];
}

const defaultNavItems: NavItem[] = [
  {
    href: '/client/home',
    icon: '🏠',
    label: '首頁',
    active: false
  },
  {
    href: '/client/dashboard',
    icon: '📊',
    label: '儀表板',
    active: false
  },
  {
    href: '/client/work-schedule',
    icon: '📅', // 修改為更適合的 emoji
    label: '工作行程',
    active: false
  },
  {
    href: '/client/work-task',
    icon: '📝',
    label: '工作任務',
    active: false
  },
  {
    href: '/client/work-epic',
    icon: '📖',
    label: '工作史詩',
    active: false
  },
  {
    href: '/client/template',
    icon: '📂',
    label: '工作範本',
    active: false
  },
  {
    href: '/client/member',
    icon: '👥',
    label: '成員',
    active: false
  },
  {
    href: '/client/profile',
    icon: '🧑‍💼',
    label: '用戶',
    active: false
  }
];

export function GlobalBottomNav({ items = defaultNavItems }: GlobalBottomNavProps) {
  const pathname = usePathname();

  // 設 NavItem 如果沒有提供
  const navItems = (items && items.length > 0 ? items : defaultNavItems).map(item => ({
    ...item,
    active: pathname === item.href
  }));

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200">
      <div className="flex h-full mx-auto justify-center">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex-1 inline-flex flex-col items-center justify-center px-5 max-w-[120px] ${item.active ? 'text-[#00B900]' : 'text-gray-500 hover:text-[#00B900]'
              }`}
          >
            <div className="text-2xl">{item.icon}</div>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
