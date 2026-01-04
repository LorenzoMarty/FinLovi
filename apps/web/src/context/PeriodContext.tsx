import { createContext, useContext, useState, type ReactNode } from 'react';

type Period = 'current' | 'previous' | 'last3';

type PeriodContextValue = {
  period: Period;
  setPeriod: (period: Period) => void;
};

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('current');

  return (
    <PeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) {
    throw new Error('usePeriod must be used within PeriodProvider');
  }
  return ctx;
}
