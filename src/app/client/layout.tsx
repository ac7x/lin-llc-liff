'use client';

import { LiffIdValueObject } from '@/modules/liff/domain/valueObjects/liff-id.value-object';
import { LiffProvider } from '@/modules/liff/interfaces/contexts/liff-context';
import { GlobalBottomNav } from '@/modules/shared/interfaces/navigation/GlobalBottomNav';
import React from 'react';

export default function ClientLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const LIFF_ID = LiffIdValueObject.getDefaultLiffId().value;

    return (
        <LiffProvider liffId={LIFF_ID}>
            <div className="pb-16 max-w-lg mx-auto">
                {children}
                <GlobalBottomNav />
            </div>
        </LiffProvider>
    );
}
