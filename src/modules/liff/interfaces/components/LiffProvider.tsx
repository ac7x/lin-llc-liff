// src/modules/liff/interfaces/components/LiffProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createLiffInitRepository } from '../../infrastructure/di/liff-init.di';
import { LiffInitApplicationService } from '../../application/services/liff-init.application.service';
import { LiffProfile } from '../../domain/models/liff-profile.type';

const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '';
const liffInitRepo = createLiffInitRepository(liffId);
const liffService = new LiffInitApplicationService(liffInitRepo);

interface LiffContextProps {
  liffService: LiffInitApplicationService;
  profile: LiffProfile | null;
  isLoggedIn: boolean;
}

const LiffContext = createContext<LiffContextProps | undefined>(undefined);

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    liffService.initialize().then(async () => {
      setIsLoggedIn(liffService.isLoggedIn());
      if (liffService.isLoggedIn()) {
        const profile = await liffService.getProfile();
        setProfile(profile);
      }
    });
  }, []);

  return (
    <LiffContext.Provider value={{ liffService, profile, isLoggedIn }}>
      {children}
    </LiffContext.Provider>
  );
};

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) throw new Error('useLiff must be used within a LiffProvider');
  return context;
};
