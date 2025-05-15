// src/modules/liff/interfaces/hooks/useLiffLogin.ts
'use client'

import { useCallback } from "react";
import { useLiff } from "../components/LiffContext";

/**
 * LIFF 登入結果介面
 */
export interface LiffLoginResult {
    success: boolean;
    error?: Error;
    isLoggedIn: boolean;
}

/**
 * LIFF 登入 Hook
 * 提供 LIFF 登入相關功能
 */
export const useLiffLogin = () => {
    const { liff, state } = useLiff();

    /**
     * 檢查用戶是否已登入
     * @returns 是否已登入
     */
    const isLoggedIn = useCallback((): boolean => {
        return liff?.isLoggedIn() || false;
    }, [liff]);

    /**
     * 執行 LIFF 登入
     * @returns LIFF 登入結果
     */
    const login = useCallback(async (): Promise<LiffLoginResult> => {
        if (!liff || !state.isInitialized) {
            return {
                success: false,
                error: new Error("LIFF 未初始化"),
                isLoggedIn: false
            };
        }

        try {
            if (!liff.isLoggedIn()) {
                await liff.login();
            }

            return {
                success: true,
                isLoggedIn: liff.isLoggedIn()
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
                isLoggedIn: false
            };
        }
    }, [liff, state.isInitialized]);

    /**
     * 執行 LIFF 登出
     */
    const logout = useCallback((): void => {
        if (liff && state.isInitialized) {
            liff.logout();
        }
    }, [liff, state.isInitialized]);

    return {
        isLoggedIn: isLoggedIn(),
        login,
        logout
    };
};
