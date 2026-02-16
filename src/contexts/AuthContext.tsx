import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  clearImpersonation as clearImpersonationApi,
  getAuthContext,
  ImpersonationState,
  loginAuthContext,
  logoutAuthContext,
  setImpersonation as setImpersonationApi,
} from '@/services/api';

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  subscriptionBlocked?: boolean;
  subscriptionOverdueMonth?: string | null;
  subscriptionDueAt?: string | null;
  subscriptionRequiredMonth?: string | null;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  impersonation: ImpersonationState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setImpersonation: (payload: ImpersonationState) => Promise<void>;
  clearImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonation, setImpersonationState] = useState<ImpersonationState>(null);

  // Restore user session from backend (persistent)
  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const ctx = await getAuthContext();
        if (!mounted) return;
        setUser(ctx.user as User | null);
        setImpersonationState(ctx.impersonation || null);
      } catch {
        if (!mounted) return;
        setUser(null);
        setImpersonationState(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const payload = await loginAuthContext(username, password);
    const userData = payload?.user;
    if (userData) {
      setUser(userData as User);
      setImpersonationState(null);
      setIsLoading(false);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setImpersonationState(null);
    sessionStorage.removeItem('superadminSecondAuth');
    logoutAuthContext();
  }, []);

  const setImpersonation = useCallback(async (payload: ImpersonationState) => {
    if (!payload) return;
    setImpersonationState(payload);
    await setImpersonationApi(payload);
  }, []);

  const clearImpersonationState = useCallback(async () => {
    setImpersonationState(null);
    await clearImpersonationApi();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        impersonation,
        login,
        logout,
        setImpersonation,
        clearImpersonation: clearImpersonationState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
