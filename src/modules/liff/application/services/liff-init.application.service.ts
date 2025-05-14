// src/modules/liff/application/services/liff-init.application.service.ts
import { LiffInitRepository } from '../../domain/repositories/liff-init.repository.interface';

export class LiffInitApplicationService {
  constructor(private readonly liffInitRepo: LiffInitRepository) {}

  async initialize(): Promise<void> {
    await this.liffInitRepo.initialize();
  }

  isLoggedIn(): boolean {
    return this.liffInitRepo.isLoggedIn();
  }

  login(): void {
    this.liffInitRepo.login();
  }

  logout(): void {
    this.liffInitRepo.logout();
  }

  async getProfile(): Promise<any> {
    return await this.liffInitRepo.getProfile();
  }
}
