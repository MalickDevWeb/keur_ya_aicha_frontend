import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Building2,
  Home,
  CreditCard,
  FileText,
  Archive,
  Shield,
  Activity,
  Gauge,
  Bell,
  Settings,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { fetchImportRuns } from '@/services/api';
import {
  DEFAULT_PLATFORM_CONFIG,
  getPlatformConfigSnapshot,
  refreshPlatformConfigFromServer,
  subscribePlatformConfigUpdates,
} from '@/services/platformConfig';
import { DEFAULT_LOGO_ASSET_PATH, resolveAssetUrl } from '@/services/assets';
import { t, MENU } from '@/messages';

type ImportRunSidebar = {
  id: string
  adminId?: string
  inserted?: unknown[]
  errors?: unknown[]
  ignored?: boolean
  readSuccess?: boolean
  readErrors?: boolean
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, impersonation } = useAuth();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const impersonationActive = !!impersonation;
  const showAdminMenus = !isSuperAdmin || impersonationActive;
  const activeAdminId = impersonation?.adminId || (isSuperAdmin ? null : user?.id || null);
  const displayName = user?.name || (isSuperAdmin ? 'Super Admin' : 'Utilisateur');
  const [importErrorCount, setImportErrorCount] = useState(0);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [hasImportErrors, setHasImportErrors] = useState(false);
  const [hasImportSuccess, setHasImportSuccess] = useState(false);
  const [brandName, setBrandName] = useState(() => {
    const config = getPlatformConfigSnapshot()
    return config.branding.appName || DEFAULT_PLATFORM_CONFIG.branding.appName
  })
  const [brandLogoUrl, setBrandLogoUrl] = useState(() => {
    const config = getPlatformConfigSnapshot()
    return config.branding.logoUrl || DEFAULT_PLATFORM_CONFIG.branding.logoUrl
  })
  const [brandLogoBroken, setBrandLogoBroken] = useState(false)
  const fallbackLogoUrl = resolveAssetUrl(DEFAULT_PLATFORM_CONFIG.branding.logoUrl || DEFAULT_LOGO_ASSET_PATH)
  const resolvedBrandLogoUrl = resolveAssetUrl(brandLogoUrl || DEFAULT_PLATFORM_CONFIG.branding.logoUrl || DEFAULT_LOGO_ASSET_PATH)

  useEffect(() => {
    let active = true
    const syncBranding = async () => {
      const config = await refreshPlatformConfigFromServer()
      if (!active) return
      setBrandName(config.branding.appName || DEFAULT_PLATFORM_CONFIG.branding.appName)
      setBrandLogoUrl(config.branding.logoUrl || DEFAULT_PLATFORM_CONFIG.branding.logoUrl)
      setBrandLogoBroken(false)
    }
    void syncBranding()
    const unsubscribe = subscribePlatformConfigUpdates((config) => {
      if (!active) return
      setBrandName(config.branding.appName || DEFAULT_PLATFORM_CONFIG.branding.appName)
      setBrandLogoUrl(config.branding.logoUrl || DEFAULT_PLATFORM_CONFIG.branding.logoUrl)
      setBrandLogoBroken(false)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!showAdminMenus) return;

    let mounted = true;
    const refreshImportErrors = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const runs = (await fetchImportRuns()) as ImportRunSidebar[];
        if (!mounted) return;

        const scopedRuns = activeAdminId
          ? runs.filter((run) => String(run.adminId || '') === String(activeAdminId))
          : runs;

        const unreadErrorCount = scopedRuns.reduce((total, run) => {
          const errorLength = Array.isArray(run.errors) ? run.errors.length : 0;
          const isUnread = !run.ignored && errorLength > 0 && !run.readErrors;
          return isUnread ? total + errorLength : total;
        }, 0);

        const unreadSuccessCount = scopedRuns.reduce((total, run) => {
          const successLength = Array.isArray(run.inserted) ? run.inserted.length : 0;
          const isUnread = successLength > 0 && !run.readSuccess;
          return isUnread ? total + successLength : total;
        }, 0);

        const errorCount = unreadErrorCount;
        const successCount = unreadSuccessCount;
        setImportErrorCount(errorCount);
        setImportSuccessCount(successCount);
        setHasImportErrors(errorCount > 0);
        setHasImportSuccess(successCount > 0);
      } catch {
        if (!mounted) return;
        setImportErrorCount(0);
        setImportSuccessCount(0);
        setHasImportErrors(false);
        setHasImportSuccess(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshImportErrors();
      }
    };

    const onImportRunsUpdated = () => {
      void refreshImportErrors();
    };

    void refreshImportErrors();
    const interval = window.setInterval(() => {
      void refreshImportErrors();
    }, 60000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('import-runs-updated', onImportRunsUpdated);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('import-runs-updated', onImportRunsUpdated);
    };
  }, [activeAdminId, location.pathname, showAdminMenus]);

  const handleLogout = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    logout();
    navigate('/login');
  };

  const handleMenuNavigate = (path?: string) => {
    if (!path) return;
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate(path);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path.includes('#')) {
      const [base, hash] = path.split('#');
      return location.pathname === base && location.hash === `#${hash}`;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const superAdminMenu = [
    {
      label: t(MENU.GROUP_SUPER_ADMIN),
      items: [
        { key: 'superAdminPending', label: t(MENU.SUPER_ADMIN_PENDING), icon: Shield, path: '/pmt/admin#demandes-en-attente' },
        { key: 'superAdminAdmins', label: t(MENU.SUPER_ADMIN_ADMINS), icon: Users, path: '/pmt/admin/admins' },
        { key: 'superAdminEntreprises', label: t(MENU.SUPER_ADMIN_ENTREPRISES), icon: Building2, path: '/pmt/admin/entreprises' },
        { key: 'superAdminStats', label: t(MENU.SUPER_ADMIN_STATS), icon: LayoutDashboard, path: '/pmt/admin/stats' },
      ],
    },
  ];

  const monitoringMenu = [
    {
      label: 'Surveillance',
      items: [
        { key: 'superAdminLogs', label: 'Logs', icon: FileText, path: '/pmt/admin/logs' },
        { key: 'requests', label: 'Requêtes', icon: Activity, path: '/pmt/admin/monitoring/requests' },
        { key: 'performance', label: 'Performance', icon: Gauge, path: '/pmt/admin/monitoring/performance' },
        { key: 'notifications', label: 'Notifications', icon: Bell, path: '/pmt/admin/notifications' },
      ],
    },
  ];

  const adminMenu = [
    {
      label: t(MENU.GROUP_PRINCIPAL),
      items: [
        { key: 'dashboard', label: t(MENU.DASHBOARD_LABEL), path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: t(MENU.GROUP_GESTION),
      items: [
        { key: 'clients', label: t(MENU.CLIENTS_LABEL), icon: Users, path: '/clients' },
        { key: 'rentals', label: t(MENU.RENTALS_LABEL), icon: Home, path: '/rentals' },
        { key: 'payments', label: t(MENU.PAYMENTS_LABEL), icon: CreditCard, path: '/payments' },
        { key: 'subscription', label: t(MENU.ADMIN_SUBSCRIPTION_LABEL), icon: CreditCard, path: '/subscription' },
      ],
    },
    {
      label: t(MENU.GROUP_ADMINISTRATION),
      items: [
        { key: 'documents', label: t(MENU.DOCUMENTS_LABEL), icon: FileText, path: '/documents' },
        { key: 'archiveAdmin', label: t(MENU.ARCHIVE_ADMIN_LABEL), icon: Archive, path: '/archive/clients' },
        ...(hasImportErrors
          ? [
              {
                key: 'importErrors',
                label: 'Imports en erreur',
                icon: AlertTriangle,
                path: '/import/errors',
                badge: importErrorCount,
                badgeTone: 'error' as const,
              },
            ]
          : []),
        ...(hasImportSuccess
          ? [
              {
                key: 'importSuccess',
                label: 'Imports réussis',
                icon: CheckCircle2,
                path: '/import/success',
                badge: importSuccessCount,
                badgeTone: 'success' as const,
              },
            ]
          : []),
      ],
    },
  ];

  const settingsPath = isSuperAdmin && !impersonationActive ? '/pmt/admin/settings' : '/settings';
  const additionalMenu = [
    {
      label: 'Paramètres',
      items: [
        { key: 'settings', label: t(MENU.SETTINGS_LABEL), icon: Settings, path: settingsPath },
      ],
    },
  ];

  const menuGroups = isSuperAdmin && !impersonationActive
    ? [...superAdminMenu, ...monitoringMenu, ...additionalMenu]
    : [...adminMenu, ...additionalMenu];

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
            {brandLogoBroken ? (
              <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
            ) : (
              <img
                src={resolvedBrandLogoUrl}
                alt={brandName || 'KYA'}
                className="h-8 w-8 rounded-md object-contain"
                onError={(event) => {
                  if (event.currentTarget.src !== fallbackLogoUrl) {
                    event.currentTarget.src = fallbackLogoUrl
                    return
                  }
                  setBrandLogoBroken(true)
                }}
              />
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sidebar-foreground truncate">{brandName || t(MENU.APP_TITLE)}</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">{t(MENU.APP_SUBTITLE)}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    {(() => {
                      const label = item.key === 'settings' ? 'Paramètres' : item.label
                      const badge = (item as { badge?: number }).badge
                      const badgeTone = (item as { badgeTone?: 'success' | 'error' }).badgeTone
                      const badgeClassName =
                        badgeTone === 'success'
                          ? 'bg-emerald-500 text-white border border-emerald-300/50 shadow-[0_0_0_1px_rgba(16,185,129,0.25)_inset] peer-hover/menu-button:!text-white peer-data-[active=true]/menu-button:!text-white'
                          : badgeTone === 'error'
                            ? 'bg-rose-500 text-white border border-rose-300/50 shadow-[0_0_0_1px_rgba(244,63,94,0.25)_inset] peer-hover/menu-button:!text-white peer-data-[active=true]/menu-button:!text-white'
                            : undefined
                      return (
                        <>
                          <SidebarMenuButton isActive={isActive(item.path)} onClick={() => handleMenuNavigate(item.path)}>
                            <item.icon />
                            {!collapsed && <span>{label}</span>}
                          </SidebarMenuButton>
                          {!collapsed && typeof badge === 'number' && badge > 0 && (
                            <SidebarMenuBadge className={badgeClassName}>{badge}</SidebarMenuBadge>
                          )}
                        </>
                      )
                    })()}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-sidebar-foreground">{displayName}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>{t(MENU.LOGOUT_LABEL)}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
