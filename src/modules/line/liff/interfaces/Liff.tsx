'use client';

import { firebaseApp } from "@/modules/shared/infrastructure/persistence/firebase/client";
import { getProfile, type Profile } from "@liff/get-profile";
import { login as liffLogin } from "@liff/login";
import { logout as liffLogout } from "@liff/logout";
import { ready as liffReady } from "@liff/ready";
import liff from "@line/liff";
import { getAuth, onAuthStateChanged, signInWithCustomToken, signOut, type User } from "firebase/auth";
import { createContext, useCallback, useEffect, useState } from "react";
import { loginWithLine } from "../infrastructure/line-login.action";

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

  // 初始化 LIFF
  useEffect(() => {
    if (typeof window === "undefined") return;

    liff
      .init({ liffId: process.env.LIFF_ID as string })
      .then(() => {
        setLiffObject(liff);
        setIsLiffInitialized(true);
        setIsLiffLoggedIn(liff.isLoggedIn());
        liffReady.then(() => setIsReady(true));
      })
      .catch((error: Error) => {
        if (!process.env.LIFF_ID) {
          console.info("請確認已設定環境變數 LIFF_ID。");
        }
        setLiffError(error.toString());
      });
  }, []);

  // 每次 render 時同步 LIFF 登入狀態
  useEffect(() => {
    if (!liffObject) return;
    setIsLiffLoggedIn(liffObject.isLoggedIn());
  }, [liffObject]);

  // 取得 Line Profile - 用 useCallback 包裝，依賴 liffObject
  const fetchLineProfile = useCallback(async () => {
    if (!liffObject) return;
    try {
      const profile = await getProfile();
      setLineProfile(profile);
    } catch (err) {
      setLiffError("取得 Line Profile 失敗: " + (err as Error).message);
    }
  }, [liffObject]);

  // 監聽 Firebase 登入狀態變化
  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && !lineProfile) {
        await fetchLineProfile();
      }
    });
    return () => unsubscribe();
  }, [lineProfile, fetchLineProfile]);

  // 登入並連接 Firebase（不再手動設定 firebaseUser）
  const firebaseLogin = useCallback(async () => {
    if (!liffObject) return;
    const accessToken = liffObject.getAccessToken();
    if (!accessToken) {
      liffObject.login(); // 觸發 LIFF 登入流程
      return;
    }

    try {
      const customToken = await loginWithLine(accessToken);
      const auth = getAuth(firebaseApp);
      await signInWithCustomToken(auth, customToken); // 登入後 firebaseUser 將由 onAuthStateChanged 設定
    } catch (err) {
      setLiffError("Firebase 登入失敗: " + (err as Error).message);
    }
  }, [liffObject]);

  // LIFF login
  const login = useCallback(async () => {
    try {
      await liffLogin();
      setIsLiffLoggedIn(true);
    } catch (err) {
      setLiffError("LIFF 登入失敗: " + (err as Error).message);
    }
  }, []);

  // LIFF logout
  const logout = useCallback(async () => {
    try {
      const auth = getAuth(firebaseApp);
      await signOut(auth);           // ✅ 登出 Firebase
      await liffLogout();            // ✅ 登出 LIFF
      setFirebaseUser(null);
      setLineProfile(null);
      setIsLiffLoggedIn(false);
      window.location.reload();      // 可選：刷新狀態
    } catch (err) {
      setLiffError("LIFF 登出失敗: " + (err as Error).message);
    }
  }, []);

  return (
    <LiffContext.Provider
      value={{
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
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}