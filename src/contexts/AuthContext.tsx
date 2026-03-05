import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import {
  clearImpersonation as clearImpersonationApi,
  getAuthContext,
  ImpersonationState,
  loginAuthContext,
  logoutAuthContext,
  setImpersonation as setImpersonationApi,
  verifySuperAdminSecondAuth as verifySuperAdminSecondAuthApi,
} from '@/services/api';
import {
  clearFailedLoginAttempts,
  getPlatformConfigSnapshot,
  refreshPlatformConfigFromServer,
} from '@/services/platformConfig';
import type { AdminFeaturePermissions } from '@/dto/frontend/responses';

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
  superAdminSecondAuthRequired?: boolean;
  permissions?: AdminFeaturePermissions;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  impersonation: ImpersonationState;
  login: (username: string, password: string) => Promise<boolean>;
  verifySuperAdminSecondAuth: (password: string) => Promise<boolean>;
  logout: () => void;
  setImpersonation: (payload: ImpersonationState) => Promise<void>;
  clearImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
}

function isPublicAuthRoute(pathname: string): boolean {
  const safePath = String(pathname || '').trim();
  return (
    safePath === '/login' ||
    safePath === '/login/' ||
    safePath === '/admin/signup' ||
    safePath === '/admin/signup/' ||
    safePath === '/signup' ||
    safePath === '/signup/'
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonation, setImpersonationState] = useState<ImpersonationState>(null);
  const secondAuthProbeInFlightRef = useRef(false);
  const SESSION_LOGIN_AT_KEY = 'kya_session_login_at';
  const SESSION_LAST_ACTIVITY_KEY = 'kya_session_last_activity';
  const LAST_LOGIN_USERNAME_KEY = 'kya_last_login_username';
  const LAST_LOGIN_IDENTIFIER_KEY = 'kya_last_login_identifier';

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
        sessionStorage.removeItem(SESSION_LOGIN_AT_KEY);
        sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
        setIsLoading(false);
        return;
      }

      if (typeof window !== 'undefined' && isPublicAuthRoute(window.location.pathname)) {
        if (!mounted) return;
        setUser(null);
        setImpersonationState(null);
        setIsLoading(false);
        return;
      }

      try {
        const ctx = await getAuthContext();
        if (!mounted) return;
        setUser(ctx.user as User | null);
        setImpersonationState(ctx.impersonation || null);
        if (ctx.user?.username) {
          localStorage.setItem(LAST_LOGIN_USERNAME_KEY, String(ctx.user.username));
        }
        const restoredIdentifier = String(ctx.user?.email || ctx.user?.username || '').trim();
        if (restoredIdentifier) {
          localStorage.setItem(LAST_LOGIN_IDENTIFIER_KEY, restoredIdentifier);
        }
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
      const normalizedIdentifier = String(username || '').trim();
      const storedIdentifier = normalizedIdentifier || String(userData.email || userData.username || '').trim();
      if (storedIdentifier) {
        localStorage.setItem(LAST_LOGIN_IDENTIFIER_KEY, storedIdentifier);
      }
      localStorage.setItem(LAST_LOGIN_USERNAME_KEY, String(userData.username || storedIdentifier || ''));
      sessionStorage.setItem(SESSION_LOGIN_AT_KEY, String(Date.now()));
      sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
      return true;
    }
    return false;
  }, []);

  const verifySuperAdminSecondAuth = useCallback(async (password: string): Promise<boolean> => {
    const payload = await verifySuperAdminSecondAuthApi(password, user?.email || user?.username);
    const userData = payload?.user;
    if (userData) {
      setUser(userData as User);
      setIsLoading(false);
      const existingIdentifier = String(localStorage.getItem(LAST_LOGIN_IDENTIFIER_KEY) || '').trim();
      const storedIdentifier = existingIdentifier || String(userData.email || user?.email || userData.username || user?.username || '').trim();
      if (storedIdentifier) {
        localStorage.setItem(LAST_LOGIN_IDENTIFIER_KEY, storedIdentifier);
      }
      localStorage.setItem(LAST_LOGIN_USERNAME_KEY, String(userData.username || user?.username || ''));
      sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
      return true;
    }
    return false;
  }, [user?.email, user?.username]);

  const logout = useCallback(() => {
    setUser(null);
    setImpersonationState(null);
    sessionStorage.removeItem(SESSION_LOGIN_AT_KEY);
    sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
    void logoutAuthContext();
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
    const applySecondAuthRequiredFallback = () => {
      setUser((prev) => {
        if (!prev) return prev;
        if (String(prev.role || '').toUpperCase() !== 'SUPER_ADMIN') return prev;
        if (prev.superAdminSecondAuthRequired === true) return prev;
        return {
          ...prev,
          superAdminSecondAuthRequired: true,
        };
      });
    };

    const onSecondAuthRequired = () => {
      if (secondAuthProbeInFlightRef.current) return;
      secondAuthProbeInFlightRef.current = true;

      void (async () => {
        try {
          const ctx = await getAuthContext();
          const backendUser = (ctx?.user || null) as User | null;
          const backendRole = String(backendUser?.role || '').toUpperCase();

          if (backendUser && backendRole === 'SUPER_ADMIN') {
            setUser(backendUser);
            setImpersonationState(ctx.impersonation || null);
            if (backendUser.superAdminSecondAuthRequired === false) {
              return;
            }
            return;
          }

          applySecondAuthRequiredFallback();
        } catch {
          applySecondAuthRequiredFallback();
        } finally {
          secondAuthProbeInFlightRef.current = false;
        }
      })();
    };

    window.addEventListener('super-admin-second-auth-required', onSecondAuthRequired);
    return () => {
      window.removeEventListener('super-admin-second-auth-required', onSecondAuthRequired);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    const role = String(user.role || '').toUpperCase();
    const requiresSecondAuth = role === 'SUPER_ADMIN' && user.superAdminSecondAuthRequired !== false;
    const hasImpersonation = Boolean(impersonation?.adminId);
    if (!requiresSecondAuth && (role !== 'SUPER_ADMIN' || hasImpersonation)) {
      void refreshPlatformConfigFromServer();
    }

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
  }, [logout, impersonation?.adminId, user?.id, user?.role, user?.superAdminSecondAuthRequired]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        impersonation,
        login,
        verifySuperAdminSecondAuth,
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
