import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AuthOrg, Department } from '../types';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';
const STORAGE_KEY = 'aria_token';

interface AuthContextValue {
  org: AuthOrg | null;
  isLoading: boolean;
  login: (orgId: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

interface JwtPayload {
  orgId: string;
  department: Department;
  orgName: string;
  exp: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<AuthOrg | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    const decoded = decodeJwt(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      setIsLoading(false);
      return;
    }
    fetch(`${BACKEND}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('Invalid');
        const me = await r.json();
        setOrg({ orgName: me.orgName, department: me.department, token });
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (orgId: string, password: string) => {
    const r = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, password }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error(body.error ?? 'Login failed');
    }
    const { token, org: o } = await r.json();
    localStorage.setItem(STORAGE_KEY, token);
    setOrg({ orgName: o.orgName, department: o.department, token });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOrg(null);
  }, []);

  return (
    <AuthContext.Provider value={{ org, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
