// src/modules/liff/interfaces/hooks/useLiffProfile.ts
'use client'

import { Profile } from "@liff/get-profile";
import { useCallback, useEffect, useState } from "react";
import { useLiff } from "../components/LiffContext";

/**
 * LIFF 個人資料 Hook
 * 提供 LIFF 用戶資料相關功能
 */
export const useLiffProfile = () => {
    const { liff, state } = useLiff();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * 獲取用戶個人資料
     */
    const fetchProfile = useCallback(async (): Promise<Profile | null> => {
        if (!liff || !state.isInitialized || !liff.isLoggedIn()) {
            setError(new Error("LIFF 未初始化或未登入"));
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const userProfile = await liff.getProfile();
            setProfile(userProfile);
            setLoading(false);
            return userProfile;
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            setLoading(false);
            return null;
        }
    }, [liff, state.isInitialized]);

    // 當 LIFF 初始化且登入狀態變化時，自動獲取個人資料
    useEffect(() => {
        if (liff && state.isInitialized && liff.isLoggedIn()) {
            fetchProfile();
        }
    }, [liff, state.isInitialized, fetchProfile]);

    return {
        profile,
        loading,
        error,
        fetchProfile
    };
};
