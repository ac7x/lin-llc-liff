'use client'

import { firebaseApp } from "@/modules/shared/infrastructure/persistence/firebase/client";
import { getProfile, type Profile } from "@liff/get-profile";
import { login as liffLogin } from "@liff/login";
import { logout as liffLogout } from "@liff/logout";
import { ready as liffReady } from "@liff/ready";
import liff from "@line/liff";
import { getAuth, signInWithCustomToken, type User } from "firebase/auth";
import { createContext, useEffect, useState } from "react";
import { loginWithLine } from "../modules/liff/infrastructure/line-login.action";

export const LiffContext = createContext<{
    liff: typeof liff | null;
    liffError: string | null;
    isLiffInitialized: boolean;
    isReady: boolean;
    firebaseLogin: () => Promise<void>;
    firebaseUser: User | null;
    lineProfile: Profile | null;
    fetchLineProfile: () => Promise<void>;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    isLoggedIn: boolean;
    isLiffLoggedIn: boolean;
}>({
    liff: null,
    liffError: null,
    isLiffInitialized: false,
    isReady: false,
    firebaseLogin: async () => { },
    firebaseUser: null,
    lineProfile: null,
    fetchLineProfile: async () => { },
    login: async () => { },
    logout: async () => { },
    isLoggedIn: false,
    isLiffLoggedIn: false,
});

export function LiffProvider({ children }: { children: React.ReactNode }) {
    const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
    const [liffError, setLiffError] = useState<string | null>(null);
    const [isLiffInitialized, setIsLiffInitialized] = useState<boolean>(false);
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [lineProfile, setLineProfile] = useState<Profile | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLiffLoggedIn, setIsLiffLoggedIn] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        liff.init({ liffId: process.env.LIFF_ID as string })
            .then(() => {
                setLiffObject(liff);
                setIsLiffInitialized(true);
                setIsLiffLoggedIn(liff.isLoggedIn());
                liffReady.then(() => setIsReady(true));
            })
            .catch((error: Error) => {
                if (!process.env.LIFF_ID) {
                    console.info(
                        "LIFF Starter: Please make sure that you provided `LIFF_ID` as an environmental variable."
                    );
                }
                setLiffError(error.toString());
            });
    }, []);

    // 新增：每次 render 時都同步 isLiffLoggedIn 狀態
    useEffect(() => {
        if (!liffObject) return;
        setIsLiffLoggedIn(liffObject.isLoggedIn());
    }, [liffObject]);

    const fetchLineProfile = async () => {
        if (!liffObject) return;
        try {
            const profile = await getProfile();
            setLineProfile(profile);
        } catch (err) {
            setLiffError("取得 Line Profile 失敗: " + (err as Error).message);
        }
    };

    const firebaseLogin = async () => {
        if (!liffObject) return;
        const accessToken = liffObject.getAccessToken();
        if (!accessToken) {
            // 自動觸發 Line 登入，登入後會自動 redirect 回來
            liffObject.login();
            return;
        }
        try {
            const customToken = await loginWithLine(accessToken);
            const auth = getAuth(firebaseApp);
            const userCredential = await signInWithCustomToken(auth, customToken);
            setFirebaseUser(userCredential.user);
            await fetchLineProfile();
        } catch (err) {
            setLiffError("Firebase 登入失敗: " + (err as Error).message);
        }
    };

    // 包裝 login/logout
    const login = async () => {
        try {
            await liffLogin();
            setIsLiffLoggedIn(true);
        } catch (err) {
            setLiffError("LIFF 登入失敗: " + (err as Error).message);
        }
    };
    const logout = async () => {
        try {
            await liffLogout();
            setFirebaseUser(null);
            setLineProfile(null);
            setIsLiffLoggedIn(false);
            window.location.reload(); // 強制刷新，確保 LIFF 狀態同步
        } catch (err) {
            setLiffError("LIFF 登出失敗: " + (err as Error).message);
        }
    };

    return (
        <LiffContext.Provider value={{
            liff: liffObject,
            liffError,
            isLiffInitialized,
            isReady,
            firebaseLogin,
            firebaseUser,
            lineProfile,
            fetchLineProfile,
            login,
            logout,
            isLoggedIn: !!firebaseUser,
            isLiffLoggedIn,
        }}>
            {children}
        </LiffContext.Provider>
    );
}