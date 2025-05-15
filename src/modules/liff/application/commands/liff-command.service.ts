// src/modules/liff/application/commands/liff-command.service.ts
import { ILiffDomainService } from "../../domain/services/liff-domain.service";
import { LiffDto, LiffStateDto } from "../dtos/liff.dto";

/**
 * LIFF 初始化命令
 */
export interface InitializeLiffCommand {
    liffId: string;
}

/**
 * LIFF 命令服務介面
 * 定義 LIFF 初始化操作
 */
export interface ILiffCommandService {
    /**
     * 初始化 LIFF SDK
     * @param command 初始化命令
     * @returns LIFF 數據傳輸對象
     */
    initialize(command: InitializeLiffCommand): Promise<LiffDto>;
}

/**
 * LIFF 命令服務實作
 * 實現 LIFF 初始化操作
 */
export class LiffCommandService implements ILiffCommandService {
    constructor(private readonly liffDomainService: ILiffDomainService) { }

    /**
     * 初始化 LIFF SDK
     * @param command 初始化命令
     * @returns LIFF 數據傳輸對象
     */
    async initialize(command: InitializeLiffCommand): Promise<LiffDto> {
        // 驗證命令
        if (!command.liffId) {
            throw new Error("liffId 不可為空");
        }

        // 調用領域服務初始化 LIFF
        const liffEntity = await this.liffDomainService.initialize(command.liffId);

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
