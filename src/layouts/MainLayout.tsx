import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { updateAdmin, updateUser } from '@/services/api';
import { AdminStatus } from '@/dto/frontend/responses';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AdminFeaturePermissions } from '@/dto/frontend/responses';
import { normalizeAdminFeaturePermissions } from '@/services/adminPermissions';
import {
  DEFAULT_PLATFORM_CONFIG,
  PlatformConfig,
  applyBrandingToDocument,
  getPlatformConfigSnapshot,
  refreshPlatformConfigFromServer,
  subscribePlatformConfigUpdates,
} from '@/services/platformConfig';

type SubscriptionBlockedDetail = {
  error?: string
  overdueMonth?: string
  dueAt?: string
}

const ADMIN_ROUTE_PERMISSION_RULES: Array<{ pattern: RegExp; feature: keyof AdminFeaturePermissions }> = [
  { pattern: /^\/dashboard(?:\/|$)/, feature: 'dashboard' },
  { pattern: /^\/clients(?:\/|$)/, feature: 'clients' },
  { pattern: /^\/rentals(?:\/|$)/, feature: 'rentals' },
  { pattern: /^\/payments(?:\/|$)/, feature: 'payments' },
  { pattern: /^\/documents(?:\/|$)/, feature: 'documents' },
  { pattern: /^\/archive(?:\/|$)/, feature: 'documents' },
  { pattern: /^\/import(?:\/|$)/, feature: 'imports' },
  { pattern: /^\/settings(?:\/|$)/, feature: 'settings' },
  { pattern: /^\/work(?:\/|$)/, feature: 'work' },
];

function resolveRequiredAdminFeature(pathname = ''): keyof AdminFeaturePermissions | null {
  const safePath = String(pathname || '').trim();
  if (!safePath || safePath === '/subscription') return null;
  const rule = ADMIN_ROUTE_PERMISSION_RULES.find((entry) => entry.pattern.test(safePath));
  return rule?.feature || null;
}

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading, user, impersonation, clearImpersonation, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isSuperAdminRoute = location.pathname.startsWith('/pmt/admin');
  const isSubscriptionRoute = location.pathname === '/subscription';
  const lastSubscriptionToastAtRef = useRef(0)
  const lastMaintenanceToastAtRef = useRef(0)
  const lastSessionToastAtRef = useRef(0)
  const lastPermissionToastAtRef = useRef(0)
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(getPlatformConfigSnapshot())
  const adminPermissions = useMemo(
    () => normalizeAdminFeaturePermissions(user?.permissions),
    [user?.permissions]
  )

  // Memoize isSuperAdmin check - placed before early returns to ensure consistent hooks order
  const isSuperAdmin = useMemo(() => String(user?.role || '').toUpperCase() === 'SUPER_ADMIN', [user?.role]);
  const showAdminNav = true;

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return t('nav.dashboard');
    if (path === '/clients') return t('nav.clients');
    if (path.includes('/clients/add')) return t('nav.addClient');
    if (path.includes('/clients/')) return t('clients.details');
    if (path === '/settings') return t('nav.settings');
    if (path === '/pmt/admin') return '';
    return '';
  };

  const setAdminStatus = async (status: AdminStatus) => {
    if (!impersonation) return;
    await updateAdmin(impersonation.adminId, { status });
    if (impersonation.userId) {
      await updateUser(impersonation.userId, { status });
    }
  };

  useEffect(() => {
    let active = true
    const loadConfig = async () => {
      const config = await refreshPlatformConfigFromServer()
      if (!active) return
      setPlatformConfig(config)
      applyBrandingToDocument(config)
    }
    void loadConfig()
    const interval = window.setInterval(() => {
      void loadConfig()
    }, 60_000)
    const unsubscribe = subscribePlatformConfigUpdates((config) => {
      if (!active) return
      setPlatformConfig(config)
      applyBrandingToDocument(config)
    })
    return () => {
      active = false
      window.clearInterval(interval)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const onSubscriptionBlocked = (event: Event) => {
      const role = String(user?.role || '').toUpperCase()
      if (role !== 'ADMIN') return
      const detail = (event as CustomEvent<SubscriptionBlockedDetail>).detail || {}
      if (!location.pathname.startsWith('/subscription')) {
        navigate('/subscription', { replace: true })
      }
      if (role === 'ADMIN' && !adminPermissions.notifications) return
      const now = Date.now()
      if (now - lastSubscriptionToastAtRef.current < 2500) return
      lastSubscriptionToastAtRef.current = now
      toast({
        title: 'Abonnement en retard',
        description:
          detail.error ||
          "Votre accès est limité jusqu'au paiement de l'abonnement mensuel.",
        variant: 'destructive',
      })
    }

    const onMaintenanceBlocked = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail || {}
      if (String(user?.role || '').toUpperCase() === 'ADMIN' && !adminPermissions.notifications) return
      const now = Date.now()
      if (now - lastMaintenanceToastAtRef.current < 2500) return
      lastMaintenanceToastAtRef.current = now
      toast({
        title: 'Maintenance active',
        description: detail.message || platformConfig.maintenance.message,
        variant: 'destructive',
      })
    }

    const onSessionSecurityLogout = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: 'inactivity' | 'duration' }>).detail || {}
      if (String(user?.role || '').toUpperCase() === 'ADMIN' && !adminPermissions.notifications) return
      const now = Date.now()
      if (now - lastSessionToastAtRef.current < 2500) return
      lastSessionToastAtRef.current = now
      toast({
        title: 'Session terminée',
        description:
          detail.reason === 'duration'
            ? 'Votre session a atteint sa durée maximale autorisée.'
            : "Déconnexion automatique après inactivité.",
        variant: 'destructive',
      })
    }

    const onAuthSessionExpired = () => {
      logout()
      navigate('/login', { replace: true })
    }

    window.addEventListener('admin-subscription-blocked', onSubscriptionBlocked)
    window.addEventListener('platform-maintenance-blocked', onMaintenanceBlocked)
    window.addEventListener('session-security-logout', onSessionSecurityLogout)
    window.addEventListener('auth-session-expired', onAuthSessionExpired)
    return () => {
      window.removeEventListener('admin-subscription-blocked', onSubscriptionBlocked)
      window.removeEventListener('platform-maintenance-blocked', onMaintenanceBlocked)
      window.removeEventListener('session-security-logout', onSessionSecurityLogout)
      window.removeEventListener('auth-session-expired', onAuthSessionExpired)
    }
  }, [adminPermissions.notifications, location.pathname, logout, navigate, platformConfig.maintenance.message, toast, user?.role])

  useEffect(() => {
    const role = String(user?.role || '').toUpperCase()
    if (role !== 'ADMIN') return
    if (!user?.subscriptionBlocked) return
    if (!adminPermissions.notifications) return
    const now = Date.now()
    if (now - lastSubscriptionToastAtRef.current < 2500) return
    lastSubscriptionToastAtRef.current = now
    const overduePeriod = user.subscriptionOverdueMonth || user.subscriptionRequiredMonth || 'période en cours'
    toast({
      title: 'Renouvellement abonnement requis',
      description: `Le mois ${overduePeriod} est dépassé. Renouvelez pour éviter les restrictions d'accès.`,
      variant: 'destructive',
    })
  }, [adminPermissions.notifications, toast, user?.role, user?.subscriptionBlocked, user?.subscriptionOverdueMonth, user?.subscriptionRequiredMonth])

  useEffect(() => {
    const role = String(user?.role || '').toUpperCase()
    if (role !== 'ADMIN') return

    const requiredFeature = resolveRequiredAdminFeature(location.pathname)
    if (!requiredFeature) return
    if (adminPermissions[requiredFeature]) return

    const fallbackPath = adminPermissions.dashboard ? '/dashboard' : '/subscription'
    if (location.pathname !== fallbackPath) {
      navigate(fallbackPath, { replace: true })
    }

    const now = Date.now()
    if (now - lastPermissionToastAtRef.current < 2500) return
    lastPermissionToastAtRef.current = now
    toast({
      title: 'Accès non autorisé',
      description: "Ce module est désactivé pour votre compte par le Super Admin.",
      variant: 'destructive',
    })
  }, [adminPermissions, location.pathname, navigate, toast, user?.role])

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isSuperAdmin && !impersonation && !location.pathname.startsWith('/pmt/admin')) {
    return <Navigate to="/pmt/admin" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {showAdminNav ? <AppSidebar /> : null}

        <div className="min-w-0 flex-1 flex flex-col overflow-x-hidden">
          {/* Header */}
          {showAdminNav && !isSuperAdminRoute ? (
            <header className="flex h-16 items-center justify-between border-b border-border/70 bg-white/90 px-4 backdrop-blur-sm lg:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9 rounded-full border border-border bg-white text-foreground shadow-sm hover:bg-accent lg:hidden" />
                <h2 className="font-semibold text-lg hidden sm:block">{getPageTitle()}</h2>
              </div>
              <LanguageSelector />
            </header>
          ) : null}
          {showAdminNav && isSuperAdminRoute ? (
            <header className="flex h-14 items-center gap-2 border-b border-border/70 bg-white/90 px-4 backdrop-blur-sm md:hidden">
              <SidebarTrigger className="h-9 w-9 rounded-full border border-border bg-white text-foreground shadow-sm hover:bg-accent" />
              <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-foreground">
                {platformConfig.branding.appName || 'Super Admin'}
              </span>
              <div className="shrink-0">
                <LanguageSelector />
              </div>
            </header>
          ) : null}

          {/* Main Content */}
          <main
            className={`flex-1 overflow-x-hidden scrollbar-thin ${
              isSubscriptionRoute ? 'overflow-auto lg:overflow-hidden' : 'overflow-auto'
            } ${showAdminNav ? 'p-4 lg:p-6' : 'p-4 md:p-6'}`}
          >
            {platformConfig.maintenance.enabled && (
              <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">Maintenance globale</p>
                <p className="mt-1 text-sm">
                  {platformConfig.maintenance.message || DEFAULT_PLATFORM_CONFIG.maintenance.message}
                </p>
              </div>
            )}
            {isSuperAdmin && impersonation && (
              <div className="mb-4 overflow-hidden rounded-2xl border border-primary/15 bg-primary text-white shadow-[0_18px_40px_rgba(18,27,83,0.18)]">
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Mode Super Admin</p>
                    <p className="text-base font-semibold">Espace de {impersonation.adminName}</p>
                    <p className="text-xs text-white/70">Actions rapides sur le statut du compte</p>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:flex md:flex-wrap md:items-center md:justify-end">
                    <Button
                      size="sm"
                      className="w-full bg-white/10 text-white hover:bg-white/20 md:w-auto md:min-w-[140px]"
                      onClick={() => setAdminStatus('SUSPENDU')}
                    >
                      Suspendre
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-white/10 text-white hover:bg-white/20 md:w-auto md:min-w-[140px]"
                      onClick={() => setAdminStatus('BLACKLISTE')}
                    >
                      Blacklister
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-white/10 text-white hover:bg-white/20 md:w-auto md:min-w-[140px]"
                      onClick={() => setAdminStatus('ARCHIVE')}
                    >
                      Archiver
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-white text-secondary hover:bg-white/90 md:w-auto md:min-w-[140px]"
                      onClick={() => setAdminStatus('ACTIF')}
                    >
                      Restaurer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="col-span-2 w-full text-white hover:bg-white/10 md:col-auto md:w-auto"
                      onClick={() => {
                        clearImpersonation();
                        navigate('/pmt/admin?section=demandes-en-attente');
                      }}
                    >
                      Quitter
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {children || <Outlet />}
            {platformConfig.branding.footerText && (
              <div className="mt-6 border-t border-border/70 pt-4 text-center text-xs text-muted-foreground">
                {platformConfig.branding.footerText}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
