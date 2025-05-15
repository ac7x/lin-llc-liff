// src/modules/liff/infrastructure/repositories/liff-repository.ts
import liff from "@line/liff";
import { LiffEntity } from "../../domain/models/liff.model";
import { ILiffRepository } from "../../domain/repositories/liff-repository.interface";

/**
 * LIFF 儲存庫實作
 * 負責管理 LIFF SDK 的實際初始化和狀態
 */
export class LiffRepository implements ILiffRepository {
    private liffEntity: LiffEntity = LiffEntity.createUninitialized();

    /**
     * 初始化 LIFF SDK
     * @param liffId LIFF 應用程式 ID
     * @returns 初始化後的 LiffEntity
     */
    async initialize(liffId: string): Promise<LiffEntity> {
        try {
            if (!liffId) {
                console.info(
                    "LIFF Starter: 請確保您已在環境變數中設置 `LIFF_ID`。"
                );
                const errorEntity = LiffEntity.createError("缺少 LIFF_ID 環境變數");
                this.liffEntity = errorEntity;
                return errorEntity;
            }

            await liff.init({ liffId });
            const initializedEntity = LiffEntity.createInitialized(liff);
            this.liffEntity = initializedEntity;
            return initializedEntity;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.toString() : String(error);
            const errorEntity = LiffEntity.createError(errorMsg);
            this.liffEntity = errorEntity;
            return errorEntity;
        }
    }

    /**
     * 取得目前的 LIFF 實體
     * @returns 當前的 LiffEntity 實例
     */
    getCurrentInstance(): LiffEntity {
        return this.liffEntity;
    }
}
