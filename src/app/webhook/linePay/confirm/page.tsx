'use client';

import { confirmLinePayCharge } from '@/modules/linePay/infrastructure/linepay.action';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function LinePayConfirmContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('正在處理您的交易...');

    useEffect(() => {
        const transactionId = searchParams.get('transactionId');
        const orderId = searchParams.get('orderId');

        if (!transactionId || !orderId) {
            setStatus('error');
            setMessage('無效的交易參數');
            return;
        }

        confirmLinePayCharge(transactionId, orderId)
            .then(() => {
                setStatus('success');
                setMessage('交易完成！感謝您的儲值。');
            })
            .catch((err) => {
                setStatus('error');
                setMessage(`交易失敗：${err.message}`);
            });
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <h1 className="text-2xl font-bold mb-4 text-center">
                    {status === 'processing' && '處理中'}
                    {status === 'success' && '交易成功'}
                    {status === 'error' && '交易失敗'}
                </h1>
                <p className="text-center text-gray-600">{message}</p>
                {status !== 'processing' && (
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        >
                            返回首頁
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LinePayConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-4 text-center">載入中</h1>
                    <p className="text-center text-gray-600">請稍候...</p>
                </div>
            </div>
        }>
            <LinePayConfirmContent />
        </Suspense>
    );
}
