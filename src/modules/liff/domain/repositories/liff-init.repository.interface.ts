// src/modules/liff/domain/repositories/liff-init.repository.interface.ts

export interface LiffInitRepository {
  initialize(): Promise<void>;
  isLoggedIn(): boolean;
  login(): void;
  logout(): void;
  getProfile(): Promise<any>;
}
