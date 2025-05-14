// src/modules/liff/domain/repositories/liff-init.repository.interface.ts

import { LiffProfile } from '../models/liff-profile.type';

export interface LiffInitRepository {
  initialize(): Promise<void>;
  isLoggedIn(): boolean;
  login(): void;
  logout(): void;
  getProfile(): Promise<LiffProfile>;
}
