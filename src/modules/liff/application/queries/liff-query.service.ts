// src/modules/liff/application/queries/liff-query.service.ts
import { ILiffDomainService } from "../../domain/services/liff-domain.service";
import { LiffDto, LiffStateDto } from "../dtos/liff.dto";

/**
 * LIFF 查詢服務介面
 * 定義獲取 LIFF 狀態的查詢操作
 */
export interface ILiffQueryService {
    /**
     * 獲取 LIFF 狀態
     * @returns LIFF 數據傳輸對象
     */
    getLiffInstance(): LiffDto;
}

/**
 * LIFF 查詢服務實作
 * 實現獲取 LIFF 狀態的查詢操作
 */
export class LiffQueryService implements ILiffQueryService {
    constructor(private readonly liffDomainService: ILiffDomainService) { }

    /**
     * 獲取 LIFF 狀態
     * @returns LIFF 數據傳輸對象
     */
    getLiffInstance(): LiffDto {
        const liffEntity = this.liffDomainService.getCurrentInstance();

        // 將領域模型映射為 DTO
        const stateDto: LiffStateDto = {
            isInitialized: liffEntity.state.isInitialized,
            error: liffEntity.state.error,
            hasError: liffEntity.state.hasError
        };

        return {
            liffObject: liffEntity.liffObject,
            state: stateDto
        };
    }
}
