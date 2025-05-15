
'use client';

import { fetchUserAssets, initiatePayment } from '@/modules/c-linePay/application/actions/payment.actions';
import { PaymentEnum, UserAssets } from '@/modules/c-linePay/domain/payment.types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// 資產快取鍵
const ASSETS_CACHE_KEY = 'user-assets-cache';

/**
 * Hook 處理充值相關邏輯 - 優化版本
 */
export function usePayment(userId: string | undefined) {
  const [assets, setAssets] = useState<UserAssets>({ diamonds: 0, hearts: 0, coins: 0, bubbles: 0 });
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState<PaymentEnum>({ type: null, message: '' });

  const router = useRouter();
  const searchParams = useSearchParams();

  // 處理查詢參數以顯示支付結果消息
  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    const amount = searchParams.get('amount');
    const reason = searchParams.get('reason');
    const message = searchParams.get('message');

    // 修正類型錯誤：確保類型安全的狀態映射
    if (status === 'success' && amount) {
      setPaymentMessage({
        type: 'success',
        message: `Congratulations! Successfully recharged ${amount} diamonds.`
      });

      const timer = setTimeout(() => {
        setPaymentMessage({ type: null, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    } else if (status === 'pending') {
      setPaymentMessage({
        type: 'pending',
        message: 'Transaction is being processed. Please wait.'
      });
    } else if (status === 'error') {
      setPaymentMessage({
        type: 'error',
        message: `Transaction failed: ${message || reason || 'Unknown error'}`
      });
    }
  }, [searchParams]);

  // 獲取用戶資產 - 優化版本
  useEffect(() => {
    if (!userId) return;

    // 嘗試從快取中獲取資產
    try {
      const cachedData = localStorage.getItem(ASSETS_CACHE_KEY);
      if (cachedData) {
        const { timestamp, userId: cachedUserId, data } = JSON.parse(cachedData);
        // 如果快取是當前用戶的且未過期（5分鐘）
        if (cachedUserId === userId && Date.now() - timestamp < 5 * 60 * 1000) {
          setAssets(data);
        }
      }
    } catch (e) {
      console.warn('讀取資產快取失敗', e);
    }

    // 無論快取是否存在，都去獲取最新數據
    fetchUserAssets(userId)
      .then(freshAssets => {
        setAssets(freshAssets);

        // 更新快取
        localStorage.setItem(
          ASSETS_CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            userId,
            data: freshAssets
          })
        );
      })
      .catch(error => console.error('Failed to fetch user assets:', error));
  }, [userId, paymentMessage.type]);

  // 處理充值表單提交
  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Please log in first.');
      return;
    }

    const diamondAmount = parseInt(amount);
    if (isNaN(diamondAmount) || diamondAmount <= 0) {
      setError('Please enter a valid diamond amount.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await initiatePayment(userId, diamondAmount);

      if (result.success && result.redirectUrl) {
        router.push(result.redirectUrl);
      } else {
        setError(result.error || 'Payment request failed');
      }
    } catch (error: any) {
      setError(error.message || 'Payment request failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    assets, amount, setAmount, isLoading, error, paymentMessage, handleRecharge
  };
}
