// src/modules/liff/domain/services/liff-domain.service.ts
import { LiffEntity } from '../models/liff.model';
import { ILiffRepository } from '../repositories/liff-repository.interface';

/**
 * LIFF 領域服務介面
 * 定義 LIFF 相關的業務行為
 */
export interface ILiffDomainService {
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

/**
 * LIFF 領域服務實作
 * 處理 LIFF 相關的核心業務邏輯
 */
export class LiffDomainService implements ILiffDomainService {
    constructor(private readonly liffRepository: ILiffRepository) { }

    async initialize(liffId: string): Promise<LiffEntity> {
        return await this.liffRepository.initialize(liffId);
    }

    getCurrentInstance(): LiffEntity {
        return this.liffRepository.getCurrentInstance();
    }
}
