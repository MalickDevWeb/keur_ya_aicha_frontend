import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  clearImpersonation as clearImpersonationApi,
  getAuthContext,
  ImpersonationState,
  loginAuthContext,
  logoutAuthContext,
  setImpersonation as setImpersonationApi,
} from '@/services/api';
import {
  clearFailedLoginAttempts,
  getPlatformConfigSnapshot,
  refreshPlatformConfigFromServer,
} from '@/services/platformConfig';

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
  const SESSION_LOGIN_AT_KEY = 'kya_session_login_at';
  const SESSION_LAST_ACTIVITY_KEY = 'kya_session_last_activity';

  // Restore user session from backend (persistent)
  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      const isElectronDesktop =
        typeof navigator !== 'undefined' && /electron/i.test(String(navigator.userAgent || ''));

      // Desktop behavior: always require explicit login when the app starts.
      if (isElectronDesktop) {
        if (!mounted) return;
        setUser(null);
        setImpersonationState(null);
        sessionStorage.removeItem('superadminSecondAuth');
        sessionStorage.removeItem(SESSION_LOGIN_AT_KEY);
        sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
        setIsLoading(false);
        return;
      }

      try {
        const ctx = await getAuthContext();
        if (!mounted) return;
        setUser(ctx.user as User | null);
        setImpersonationState(ctx.impersonation || null);
        if (ctx.user?.id && !sessionStorage.getItem(SESSION_LOGIN_AT_KEY)) {
          sessionStorage.setItem(SESSION_LOGIN_AT_KEY, String(Date.now()));
        }
        if (ctx.user?.id) {
          sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
        }
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
      clearFailedLoginAttempts();
      sessionStorage.setItem(SESSION_LOGIN_AT_KEY, String(Date.now()));
      sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setImpersonationState(null);
    sessionStorage.removeItem('superadminSecondAuth');
    sessionStorage.removeItem(SESSION_LOGIN_AT_KEY);
    sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
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

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    void refreshPlatformConfigFromServer();

    const markActivity = () => {
      sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
    };

    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    markActivity();

    const interval = window.setInterval(() => {
      if (!active) return;
      const config = getPlatformConfigSnapshot().sessionSecurity;
      const now = Date.now();
      const loginAt = Number(sessionStorage.getItem(SESSION_LOGIN_AT_KEY) || now);
      const lastActivity = Number(sessionStorage.getItem(SESSION_LAST_ACTIVITY_KEY) || now);

      const maxSessionMs = Math.max(1, config.sessionDurationMinutes) * 60 * 1000;
      const inactivityMs = Math.max(1, config.inactivityTimeoutMinutes) * 60 * 1000;

      if (maxSessionMs > 0 && now - loginAt >= maxSessionMs) {
        window.dispatchEvent(
          new CustomEvent('session-security-logout', {
            detail: { reason: 'duration' },
          })
        );
        logout();
        return;
      }

      if (inactivityMs > 0 && now - lastActivity >= inactivityMs) {
        window.dispatchEvent(
          new CustomEvent('session-security-logout', {
            detail: { reason: 'inactivity' },
          })
        );
        logout();
      }
    }, 15_000);

    return () => {
      active = false;
      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.clearInterval(interval);
    };
  }, [logout, user?.id]);

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
