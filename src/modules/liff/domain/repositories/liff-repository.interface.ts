// src/modules/liff/domain/repositories/liff-repository.interface.ts
import { LiffEntity } from '../models/liff.model';

/**
 * LIFF 儲存庫介面
 * 定義與 LIFF SDK 的初始化和互動行為
 */
export interface ILiffRepository {
    /**
     * 初始化 LIFF SDK
     * @param liffId LIFF 應用程式 ID
     * @returns 初始化後的 LiffEntity
     */
    initialize(liffId: string): Promise<LiffEntity>;

    /**
     * 取得目前的 LIFF 實體
     * @returns 當前的 LiffEntity 實例
     */
    getCurrentInstance(): LiffEntity;
}
