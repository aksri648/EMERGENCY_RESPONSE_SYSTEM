import { ReactNode, createContext, useContext } from 'react';
import { CaseStatus, EmergencyCase } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

interface CasesContextValue {
  cases: EmergencyCase[];
  isConnected: boolean;
  activeAlert: EmergencyCase | null;
  pendingCount: number;
  dismissAlert: () => void;
  updateCaseStatus: (id: string, status: CaseStatus) => Promise<void>;
}

const CasesContext = createContext<CasesContextValue | null>(null);

export function CasesProvider({ children }: { children: ReactNode }) {
  const value = useWebSocket();
  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases(): CasesContextValue {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error('useCases must be used inside CasesProvider');
  return ctx;
}
