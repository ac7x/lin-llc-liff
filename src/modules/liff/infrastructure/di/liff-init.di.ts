// src/modules/liff/infrastructure/di/liff-init.di.ts
import { LiffInitService } from '../services/liff-init.service';
import { LiffInitRepository } from '../../domain/repositories/liff-init.repository.interface';

// 依賴注入工廠
export function createLiffInitRepository(liffId: string): LiffInitRepository {
  return new LiffInitService(liffId);
}
