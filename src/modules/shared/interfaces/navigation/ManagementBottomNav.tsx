'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const navItems = [
    {
        href: '/management/',
        icon: '📆',
        label: '日程',
        popover: [
            { label: '排程客戶', href: '/management/work-schedule' },
            { label: '排程後端', href: '/management/work-schedule-admin' },
            { label: '儀表板', href: '/management/dashboard' },
        ],
    },
    {
        href: '/management/',
        icon: '🗂️',
        label: '工作模組',
        popover: [
            { label: '工作任務', href: '/management/work-task' },
            { label: '工作史詩', href: '/management/work-epic' },
            { label: '工作範本', href: '/management/work-template' },
        ],
    },
    {
        href: '/management/',
        icon: '👤',
        label: '成員管理',
        popover: [
            { label: '技能管理', href: '/management/work-skill' },
            { label: '成員列表', href: '/management/work-member' },
        ],
    },
];

/**
 * 管理後台底部導覽列
 */
export function ManagementBottomNav() {
    const [open, setOpen] = useState<number | null>(null);
    const popoverRefs = useRef<Array<HTMLDivElement | null>>([]);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (
                open !== null &&
                popoverRefs.current[open] &&
                !popoverRefs.current[open]?.contains(e.target as Node)
            ) {
                setOpen(null);
            }
        };
        if (open !== null) {
            document.addEventListener('mousedown', handle);
        }
        return () => {
            document.removeEventListener('mousedown', handle);
        };
    }, [open]);

    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                background: 'white',
                borderTop: '1px solid #e5e7eb',
                height: '4rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 50,
            }}
        >
            {navItems.map((item, idx) => (
                <div
                    key={item.label}
                    style={{
                        position: 'relative',
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <button
                        onClick={() => setOpen(open === idx ? null : idx)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#00B900',
                            fontWeight: 600,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '0.75rem',
                            textDecoration: 'none',
                            fontSize: '1.25rem',
                            minWidth: 76,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
                    </button>
                    {open === idx && (
                        <div
                            ref={(el) => {
                                popoverRefs.current[idx] = el;
                            }}
                            style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 8px)',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                padding: '0.5rem 0',
                                minWidth: 120,
                                zIndex: 100,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            {item.popover.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    style={{
                                        color: '#222',
                                        padding: '0.5rem 1.5rem',
                                        width: '100%',
                                        textAlign: 'center',
                                        borderRadius: 8,
                                        textDecoration: 'none',
                                        fontSize: 15,
                                        transition: 'background 0.2s',
                                    }}
                                    onClick={() => setOpen(null)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
}

export default ManagementBottomNav;