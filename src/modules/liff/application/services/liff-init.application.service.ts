// src/modules/liff/application/services/liff-init.application.service.ts
import { LiffInitRepository } from '../../domain/repositories/liff-init.repository.interface';
import { LiffProfile } from '../../domain/models/liff-profile.type';

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

  async getProfile(): Promise<LiffProfile> {
    return await this.liffInitRepo.getProfile();
  }
}
