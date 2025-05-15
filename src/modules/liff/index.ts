/**
 * LIFF 模組索引文件
 * 匯出所有公開 API
 */

// 介面層 (當其他模組需要使用 LIFF 功能時，主要透過此層引用)
export * from './interfaces';

// 應用層 (當需要在其他模組中調用 LIFF 應用服務時使用)
export * from './application/commands/liff-command.service';
export * from './application/dtos/liff.dto';
export * from './application/queries/liff-query.service';

// 領域層 (通常只供內部模組使用，其他模組通常不需要直接引用)
// 但可以根據需要導出特定的領域模型
export * from './domain/models/liff.model';
export * from './domain/repositories/liff-repository.interface';
export * from './domain/services/liff-domain.service';

