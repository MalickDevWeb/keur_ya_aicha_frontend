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
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
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
import { t, MENU } from '@/messages';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, impersonation } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const impersonationActive = !!impersonation;
  const showAdminMenus = !isSuperAdmin || impersonationActive;
  const displayName = user?.name || (isSuperAdmin ? 'Super Admin' : user?.username || '');
  const displayHandle = user?.username || (isSuperAdmin ? 'superadmin' : '');
  const [expandedItems, setExpandedItems] = useState<string[]>(
    isSuperAdmin ? ['superAdmin'] : ['clients']
  );
  const [importErrorCount, setImportErrorCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const refreshImportErrors = async () => {
      try {
        const runs = (await fetchImportRuns()) as Array<{ ignored?: boolean; errors?: unknown[] }>;
        if (!mounted) return;
        const latestRun = runs.find((run) => !run.ignored);
        const count = Array.isArray(latestRun?.errors) ? latestRun.errors.length : 0;
        setImportErrorCount(count);
      } catch {
        if (!mounted) return;
        setImportErrorCount(0);
      }
    };
    refreshImportErrors();
    const interval = setInterval(refreshImportErrors, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
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
      ],
    },
    {
      label: t(MENU.GROUP_ADMINISTRATION),
      items: [
        { key: 'documents', label: t(MENU.DOCUMENTS_LABEL), icon: FileText, path: '/documents' },
        { key: 'archiveAdmin', label: t(MENU.ARCHIVE_ADMIN_LABEL), icon: Archive, path: '/archive/clients' },
      ],
    },
  ];

  const additionalMenu = [
    {
      label: 'Paramètres',
      items: [
        { key: 'settings', label: t(MENU.SETTINGS_LABEL), icon: Settings, path: '/pmt/admin/settings' },
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
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sidebar-foreground truncate">{t(MENU.APP_TITLE)}</h1>
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
                      return (
                    <SidebarMenuButton isActive={isActive(item.path)} onClick={() => navigate(item.path)}>
                      <item.icon />
                      {!collapsed && <span>{label}</span>}
                    </SidebarMenuButton>
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
            <p className="text-xs text-sidebar-foreground/60">@{displayHandle}</p>
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
