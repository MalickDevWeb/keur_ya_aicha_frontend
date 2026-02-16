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
import { listAuditLogs } from '@/services/api/auditLogs.api';
import {
  DEFAULT_PLATFORM_CONFIG,
  PlatformConfig,
  applyBrandingToDocument,
  getPlatformConfigSnapshot,
  refreshPlatformConfigFromServer,
  sendComplianceWebhookAlert,
  subscribePlatformConfigUpdates,
} from '@/services/platformConfig';

type SubscriptionBlockedDetail = {
  error?: string
  overdueMonth?: string
  dueAt?: string
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
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(getPlatformConfigSnapshot())

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
    if (String(user?.role || '').toUpperCase() !== 'SUPER_ADMIN') return
    if (!platformConfig.auditCompliance.autoExportEnabled) return

    const intervalMs = Math.max(1, platformConfig.auditCompliance.autoExportIntervalHours) * 60 * 60 * 1000
    const metaKey = 'kya_audit_auto_export_meta'

    const maybeRunAutoExport = async () => {
      try {
        const rawMeta = localStorage.getItem(metaKey)
        const parsedMeta = rawMeta ? (JSON.parse(rawMeta) as { generatedAt?: string }) : null
        const lastAt = parsedMeta?.generatedAt ? new Date(parsedMeta.generatedAt).getTime() : 0
        const now = Date.now()
        if (lastAt > 0 && now - lastAt < intervalMs) return

        const logs = await listAuditLogs()
        const format = platformConfig.auditCompliance.autoExportFormat
        const generatedAt = new Date().toISOString()
        if (format === 'json') {
          localStorage.setItem('kya_audit_auto_export_data', JSON.stringify(logs))
        } else {
          const headers = ['id', 'createdAt', 'actor', 'action', 'targetType', 'targetId', 'message', 'ipAddress']
          const rows = logs.map((log) =>
            headers
              .map((key) => {
                const raw = String((log as Record<string, unknown>)[key] ?? '')
                return `"${raw.replace(/"/g, '""')}"`
              })
              .join(',')
          )
          localStorage.setItem('kya_audit_auto_export_data', [headers.join(','), ...rows].join('\n'))
        }
        localStorage.setItem(
          metaKey,
          JSON.stringify({
            generatedAt,
            count: logs.length,
            format,
          })
        )
        void sendComplianceWebhookAlert('security', {
          event: 'auto_audit_export',
          generatedAt,
          count: logs.length,
          format,
        })
      } catch {
        // ignore background auto-export failures
      }
    }

    void maybeRunAutoExport()
    const timer = window.setInterval(() => {
      void maybeRunAutoExport()
    }, 60_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    platformConfig.auditCompliance.autoExportEnabled,
    platformConfig.auditCompliance.autoExportFormat,
    platformConfig.auditCompliance.autoExportIntervalHours,
    user?.role,
  ])

  useEffect(() => {
    const onSubscriptionBlocked = (event: Event) => {
      const role = String(user?.role || '').toUpperCase()
      if (role !== 'ADMIN') return
      const detail = (event as CustomEvent<SubscriptionBlockedDetail>).detail || {}
      if (!location.pathname.startsWith('/subscription')) {
        navigate('/subscription', { replace: true })
      }
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
  }, [location.pathname, logout, navigate, platformConfig.maintenance.message, toast, user?.role])

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
      <div className="min-h-screen flex w-full">
        {showAdminNav ? <AppSidebar /> : null}

        <div className="flex-1 flex flex-col">
          {/* Header */}
          {showAdminNav && !isSuperAdminRoute ? (
            <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden h-9 w-9 rounded-full border border-[#121B53]/20 bg-white/90 text-[#121B53] shadow-sm hover:bg-[#121B53]/10" />
                <h2 className="font-semibold text-lg hidden sm:block">{getPageTitle()}</h2>
              </div>
              <LanguageSelector />
            </header>
          ) : null}
          {showAdminNav && isSuperAdminRoute ? (
            <header className="md:hidden h-14 border-b bg-card flex items-center gap-2 px-4">
              <SidebarTrigger className="h-9 w-9 rounded-full border border-[#121B53]/20 bg-white/90 text-[#121B53] shadow-sm hover:bg-[#121B53]/10" />
              <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-slate-900">
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
              <div className="mb-4 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white shadow-lg">
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-blue-200">Mode Super Admin</p>
                    <p className="text-base font-semibold">Espace de {impersonation.adminName}</p>
                    <p className="text-xs text-blue-200">Actions rapides sur le statut du compte</p>
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
                      className="w-full bg-emerald-500/90 text-white hover:bg-emerald-500 md:w-auto md:min-w-[140px]"
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
                        navigate('/pmt/admin#demandes-en-attente');
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
