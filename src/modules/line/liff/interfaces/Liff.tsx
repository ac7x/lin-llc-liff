'use client'

import { firebaseApp } from "@/modules/shared/infrastructure/persistence/firebase/clientApp"
import { getProfile, type Profile } from "@liff/get-profile"
import { login as liffLogin } from "@liff/login"
import { logout as liffLogout } from "@liff/logout"
import { ready as liffReady } from "@liff/ready"
import liff from "@line/liff"
import { getAuth, onAuthStateChanged, signInWithCustomToken, signOut, type User } from "firebase/auth"
import { createContext, useCallback, useEffect, useState } from "react"
import { loginWithLine } from "../infrastructure/liff.action"

export const LiffContext = createContext<{
  liff: typeof liff | null
  liffError: string | null
  isLiffInitialized: boolean
  isReady: boolean
  firebaseLogin: () => Promise<void>
  firebaseUser: User | null
  lineProfile: Profile | null
  fetchLineProfile: () => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
  isLoggedIn: boolean
  isLiffLoggedIn: boolean
}>({
  liff: null, liffError: null, isLiffInitialized: false, isReady: false,
  firebaseLogin: async () => { }, firebaseUser: null, lineProfile: null,
  fetchLineProfile: async () => { }, login: async () => { }, logout: async () => { },
  isLoggedIn: false, isLiffLoggedIn: false
})

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null)
  const [liffError, setLiffError] = useState<string | null>(null)
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [lineProfile, setLineProfile] = useState<Profile | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLiffLoggedIn, setIsLiffLoggedIn] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    liff.init({ liffId: process.env.LIFF_ID as string })
      .then(() => {
        setLiffObject(liff)
        setIsLiffInitialized(true)
        setIsLiffLoggedIn(liff.isLoggedIn())
        liffReady.then(() => setIsReady(true))
      })
      .catch((error: Error) => setLiffError(error.toString()))
  }, [])

  useEffect(() => { if (liffObject) setIsLiffLoggedIn(liffObject.isLoggedIn()) }, [liffObject])

  const fetchLineProfile = useCallback(async () => {
    if (!liffObject) return
    try { setLineProfile(await getProfile()) }
    catch (err) { setLiffError("取得 Line Profile 失敗: " + (err as Error).message) }
  }, [liffObject])

  useEffect(() => {
    const auth = getAuth(firebaseApp)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user && !lineProfile) await fetchLineProfile()
    })
    return () => unsubscribe()
  }, [lineProfile, fetchLineProfile])

  const firebaseLogin = useCallback(async () => {
    if (!liffObject) return
    const accessToken = liffObject.getAccessToken()
    if (!accessToken) { liffObject.login(); return }
    try {
      const customToken = await loginWithLine(accessToken)
      await signInWithCustomToken(getAuth(firebaseApp), customToken)
    } catch (err) {
      setLiffError("Firebase 登入失敗: " + (err as Error).message)
    }
  }, [liffObject])

  const login = useCallback(async () => {
    try { await liffLogin(); setIsLiffLoggedIn(true) }
    catch (err) { setLiffError("LIFF 登入失敗: " + (err as Error).message) }
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut(getAuth(firebaseApp))
      await liffLogout()
      setFirebaseUser(null)
      setLineProfile(null)
      setIsLiffLoggedIn(false)
      window.location.reload()
    } catch (err) { setLiffError("LIFF 登出失敗: " + (err as Error).message) }
  }, [])

  return (
    <LiffContext.Provider value={{
      liff: liffObject, liffError, isLiffInitialized, isReady,
      firebaseLogin, firebaseUser, lineProfile, fetchLineProfile,
      login, logout, isLoggedIn: !!firebaseUser, isLiffLoggedIn
    }}>
      {children}
    </LiffContext.Provider>
  )
}