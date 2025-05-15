// src/modules/liff/interfaces/components/LiffContext.tsx
'use client'

import liff from "@line/liff";
import { createContext, useContext } from "react";
import { LiffStateDto } from "../../application/dtos/liff.dto";

/**
 * LIFF 上下文介面
 * 定義 React Context 中可用的 LIFF 相關數據和方法
 */
export interface LiffContextType {
    liff: typeof liff | null;
    state: LiffStateDto;
}

/**
 * LIFF Context 初始值
 */
const initialContext: LiffContextType = {
    liff: null,
    state: {
        isInitialized: false,
        error: null,
        hasError: false
    }
};

/**
 * LIFF React Context
 * 提供跨組件共享 LIFF 狀態
 */
export const LiffContext = createContext<LiffContextType>(initialContext);

/**
 * LIFF Context Hook
 * 方便在 React 組件中使用 LIFF Context
 */
export const useLiff = (): LiffContextType => {
    const context = useContext(LiffContext);

    if (!context) {
        throw new Error("useLiff 必須在 LiffProvider 內部使用");
    }

    return context;
};
