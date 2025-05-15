// src/modules/liff/application/dtos/liff.dto.ts
import liff from "@line/liff";

/**
 * LIFF 狀態 DTO
 * 用於在應用層傳輸 LIFF 狀態數據
 */
export interface LiffStateDto {
    isInitialized: boolean;
    error: string | null;
    hasError: boolean;
}

/**
 * LIFF DTO
 * 用於在應用層傳輸 LIFF 相關數據
 */
export interface LiffDto {
    liffObject: typeof liff | null;
    state: LiffStateDto;
}
