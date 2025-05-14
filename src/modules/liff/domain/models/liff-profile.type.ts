// src/modules/liff/domain/models/liff-profile.type.ts

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl: string;
  statusMessage?: string;
  email?: string;
}
