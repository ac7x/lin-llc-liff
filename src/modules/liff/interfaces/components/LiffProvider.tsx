// src/modules/liff/interfaces/components/LiffProvider.tsx
'use client'

import { useEffect, useState } from "react";
import { InitializeLiffCommand, LiffCommandService } from "../../application/commands/liff-command.service";
import { LiffDto } from "../../application/dtos/liff.dto";
import { LiffDomainService } from "../../domain/services/liff-domain.service";
import { LiffRepository } from "../../infrastructure/repositories/liff-repository";
import { LiffContext, LiffContextType } from "./LiffContext";

/**
 * LIFF Provider Props
 */
interface LiffProviderProps {
    children: React.ReactNode;
    liffId?: string;
}

/**
 * LIFF Provider 組件
 * 提供 LIFF 狀態給整個應用
 */
export const LiffProvider: React.FC<LiffProviderProps> = ({
    children,
    liffId = process.env.LIFF_ID
}) => {
    // 初始化 LIFF Context 狀態
    const [liffContext, setLiffContext] = useState<LiffContextType>({
        liff: null,
        state: {
            isInitialized: false,
            error: null,
            hasError: false
        }
    });

    useEffect(() => {
        // 避免在 SSR 中執行
        if (typeof window === "undefined") return;

        // 初始化依賴關係和服務
        const liffRepository = new LiffRepository();
        const liffDomainService = new LiffDomainService(liffRepository);
        const liffCommandService = new LiffCommandService(liffDomainService);

        // 初始化 LIFF SDK
        const initializeLiff = async () => {
            if (!liffId) {
                console.error("未提供 LIFF ID，LIFF SDK 初始化失敗");
                setLiffContext(prevState => ({
                    ...prevState,
                    state: {
                        isInitialized: false,
                        error: "未提供 LIFF ID",
                        hasError: true
                    }
                }));
                return;
            }

            try {
                // 執行初始化命令
                const command: InitializeLiffCommand = { liffId };
                const result: LiffDto = await liffCommandService.initialize(command);

                // 更新 Context 狀態
                setLiffContext({
                    liff: result.liffObject,
                    state: result.state
                });
            } catch (error) {
                console.error("LIFF 初始化錯誤:", error);
                setLiffContext(prevState => ({
                    ...prevState,
                    state: {
                        isInitialized: false,
                        error: error instanceof Error ? error.message : String(error),
                        hasError: true
                    }
                }));
            }
        };

        initializeLiff();
    }, [liffId]);

    return (
        <LiffContext.Provider value={liffContext}>
            {children}
        </LiffContext.Provider>
    );
};
