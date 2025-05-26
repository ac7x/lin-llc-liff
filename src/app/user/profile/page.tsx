'use client'
import { LiffContext } from "@/modules/line/liff/interfaces/Liff"
import { firebaseApp } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client"
import { UserBottomNav } from "@/modules/shared/interfaces/navigation/user-bottom-nav"
import { doc, getDoc, getFirestore } from "firebase/firestore"
import Image from "next/image"
import { useContext, useEffect, useRef, useState } from "react"

export default function UserProfilePage() {
  const { isLiffInitialized, firebaseLogin, firebaseUser, lineProfile, logout, login, isLoggedIn, isLiffLoggedIn } = useContext(LiffContext)
  const [actionMessage, setActionMessage] = useState("")
  const [userAssets, setUserAssets] = useState<{ coin: number; diamond: number } | null>(null)
  const autoLoginTriggered = useRef(false)

  useEffect(() => {
    const tryLoginAndFetchAssets = async () => {
      if (isLiffLoggedIn && !isLoggedIn && isLiffInitialized && !autoLoginTriggered.current) {
        autoLoginTriggered.current = true
        try { await firebaseLogin(); setActionMessage("登入成功") }
        catch (err) { setActionMessage(`登入失敗: ${(err instanceof Error ? err.message : String(err)) || "未知錯誤"}`) }
      }
      if (!isLiffLoggedIn || !isLiffInitialized) autoLoginTriggered.current = false
      if (firebaseUser) {
        try {
          const assetDoc = await getDoc(doc(getFirestore(firebaseApp), "workAsset", firebaseUser.uid))
          setUserAssets(assetDoc.exists() ? assetDoc.data() as { coin: number; diamond: number } : null)
        } catch { setUserAssets(null) }
      } else setUserAssets(null)
    }
    tryLoginAndFetchAssets()
  }, [isLiffLoggedIn, isLoggedIn, isLiffInitialized, firebaseLogin, firebaseUser])

  return (
    <>
      <main className="py-6 px-2 sm:py-8 sm:px-4 min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="space-y-6 max-w-full sm:max-w-md mx-auto">
          {lineProfile && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col gap-4 transition-colors duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                {lineProfile.pictureUrl &&
                  <Image
                    src={lineProfile.pictureUrl}
                    alt="個人頭像"
                    width={80}
                    height={80}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow"
                  />
                }
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">{lineProfile.displayName}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 break-all">{lineProfile.userId}</p>
                </div>
              </div>
            </div>
          )}
          {userAssets && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col gap-4 transition-colors duration-300">
              <h3 className="font-semibold text-base sm:text-lg mb-2">我的資產</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl shadow-inner transition-colors duration-300">
                  <span className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-300">{userAssets.coin}</span>
                  <span className="text-xs text-yellow-700 dark:text-yellow-200 mt-1">金幣</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-inner transition-colors duration-300">
                  <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-300">{userAssets.diamond}</span>
                  <span className="text-xs text-blue-700 dark:text-blue-200 mt-1">鑽石</span>
                </div>
              </div>
            </div>
          )}
          {actionMessage && (
            <div className="text-center text-sm text-amber-500 dark:text-amber-400 transition-colors duration-300">
              {actionMessage}
            </div>
          )}
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="
                w-full mt-4 py-2 rounded
                bg-gray-200 dark:bg-gray-700
                hover:bg-gray-300 dark:hover:bg-gray-600
                text-gray-900 dark:text-white
                font-semibold text-base sm:text-lg
                transition-colors duration-300
              "
            >
              登出
            </button>
          ) : (
            <button
              onClick={login}
              className="
                w-full mt-4 py-2 rounded
                bg-blue-600 dark:bg-blue-700
                hover:bg-blue-700 dark:hover:bg-blue-600
                text-white
                font-semibold text-base sm:text-lg
                transition-colors duration-300
              "
            >
              登入
            </button>
          )}
        </div>
      </main>
      <UserBottomNav />
    </>
  )
}