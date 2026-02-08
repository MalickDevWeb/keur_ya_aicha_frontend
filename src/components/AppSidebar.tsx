import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  LogOut,
  Building2,
  Home,
  CreditCard,
  FileText,
  Archive,
  Shield,
  AlertTriangle,
  ChevronDown
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { fetchImportRuns } from '@/services/api';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { key: 'dashboard', label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Gestion',
    items: [
      {
        key: 'clients',
        label: 'Clients',
        icon: Users,
        submenu: [
          { key: 'clientsList', label: 'Liste des clients', path: '/clients' },
          { key: 'clientsAdd', label: 'Ajouter un client', path: '/clients/add' },
          { key: 'clientsImportSuccess', label: 'Imports réussis', path: '/import/success' },
        ]
      },
      {
        key: 'rentals',
        label: 'Locations',
        icon: Home,
        submenu: [
          { key: 'rentalsList', label: 'Liste des locations', path: '/rentals' },
          { key: 'rentalsAdd', label: 'Ajouter une location', path: '/rentals/add' },
        ]
      },
      {
        key: 'payments',
        label: 'Paiements',
        icon: CreditCard,
        submenu: [
          { key: 'paymentsMonthly', label: 'Paiements mensuels', path: '/payments' },
          { key: 'paymentsDeposit', label: 'Paiements de caution', path: '/payments/deposit' },
          { key: 'paymentsHistory', label: 'Historique', path: '/payments/history' },
          { key: 'paymentsReceipts', label: 'Reçus', path: '/payments/receipts' },
        ]
      },
    ]
  },
  {
    label: 'Administration',
    items: [
      {
        key: 'documents',
        label: '📑 Gest Docs',
        icon: FileText,
        submenu: [
          { key: 'documentsAll', label: '📋 Tous les documents', path: '/documents' },
          { key: 'documentsList', label: '📄 Contrats signés', path: '/documents/contracts' },
          { key: 'documentsReceipts', label: '🧾 Reçus de paiement', path: '/documents/receipts' },
          { key: 'documentsArchive', label: '📎 Autres documents', path: '/documents/archive' },
        ]
      },
      {
        key: 'archiveAdmin',
        label: '⚙️ Gest Admin',
        icon: Archive,
        submenu: [
          { key: 'archiveClients', label: '🗂️ Clients archivés', path: '/archive/clients' },
          { key: 'blacklist', label: '⛔ Blacklist', path: '/archive/blacklist' },
          { key: 'danger', label: '⚠️ Zone Danger', path: '/danger/clients' },
          { key: 'settings', label: '⚙️ Paramètres', path: '/settings' },
          { key: 'work', label: '📋 Travaux à faire', path: '/work' },
        ]
      },
    ]
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { logout, user, impersonation } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const impersonationActive = !!impersonation;
  const showAdminMenus = !isSuperAdmin || impersonationActive;
  const displayName = user?.name || (isSuperAdmin ? 'Super Admin' : user?.username || '');
  const displayHandle = user?.username || (isSuperAdmin ? 'superadmin' : '');
  const [expandedItems, setExpandedItems] = useState<string[]>(
    isSuperAdmin ? ['clients', 'superAdmin'] : ['clients']
  );
  const [importErrorCount, setImportErrorCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const refreshImportErrors = async () => {
      try {
        const runs = await fetchImportRuns();
        const latest = runs.find((r: any) => !r.ignored);
        if (!mounted) return;
        const count = Array.isArray(latest?.errors) ? latest.errors.length : 0;
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
    setExpandedItems(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sidebar-foreground truncate">Gestion Locative</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Administration</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {showAdminMenus && menuGroups.map((group, index) => (
            <SidebarGroup key={group.label} className={group.label === 'Administration' ? 'mt-8' : ''}>
              {!collapsed && <SidebarGroupLabel className="text-xs text-sidebar-foreground/60">{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isExpanded = expandedItems.includes(item.key);
                    const hasSubmenu = 'submenu' in item && item.submenu;
                    const submenuItems = hasSubmenu && item.key === 'clients' && importErrorCount > 0
                      ? [
                          ...item.submenu,
                          { key: 'importErrors', label: 'Erreurs d’import', path: '/import/errors', badge: importErrorCount },
                        ]
                      : item.submenu;
                    const activeSubmenu = hasSubmenu && submenuItems.some(sub => isActive(sub.path));

                    return (
                      <SidebarMenuItem key={item.key} className={group.label === 'Administration' && item.key === 'archiveAdmin' ? 'mt-4' : ''}>
                        <SidebarMenuButton
                          onClick={() => {
                            if (hasSubmenu) {
                              toggleExpand(item.key);
                            } else {
                              navigate(item.path);
                            }
                          }}
                          className={cn(
                            'w-full justify-between gap-2 transition-colors',
                            (isActive(item.path) || activeSubmenu)
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                          </div>
                          {hasSubmenu && !collapsed && (
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 transition-transform",
                                isExpanded && "rotate-180"
                              )}
                            />
                          )}
                        </SidebarMenuButton>

                        {hasSubmenu && isExpanded && !collapsed && (
                          <SidebarMenuSub>
                            {submenuItems.map((subitem) => (
                              <SidebarMenuSubItem key={subitem.key}>
                                <SidebarMenuSubButton
                                  onClick={() => navigate(subitem.path)}
                                  className={cn(
                                    'w-full justify-start transition-colors',
                                    isActive(subitem.path)
                                      ? 'bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium'
                                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                                  )}
                                >
                                  <span className="flex w-full items-center justify-between gap-2">
                                    <span>{subitem.label}</span>
                                    {'badge' in subitem && subitem.badge ? (
                                      <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                                        {subitem.badge}
                                      </span>
                                    ) : null}
                                  </span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        {isSuperAdmin && (
          <SidebarGroup className="mt-10">
            {!collapsed && <SidebarGroupLabel className="text-xs text-sidebar-foreground/60 tracking-wider">Super Admin</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/pmt/admin')}
                    className={cn(
                      'w-full justify-between gap-3 transition-colors rounded-xl py-2.5 px-3',
                      isActive('/pmt/admin')
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-semibold">Super Admin</span>}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {!collapsed && (
                  <SidebarMenuSub className="mt-2">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        onClick={() => navigate('/pmt/admin/stats')}
                        className="py-2"
                      >
                        <span className="text-sm">Stats globales</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        onClick={() => navigate('/pmt/admin/admins')}
                        className="py-2"
                      >
                        <span className="text-sm">Liste admins + actions</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        onClick={() => navigate('/pmt/admin#acces-rapide')}
                        className="py-2"
                      >
                        <span className="text-sm">Accès rapide</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        onClick={() => navigate('/pmt/admin#logs-audit')}
                        className="py-2"
                      >
                        <span className="text-sm">Logs / audit</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        onClick={() => navigate('/pmt/admin#demandes-en-attente')}
                        className="py-2"
                      >
                        <span className="text-sm">Demandes en attente</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        onClick={() => navigate('/pmt/admin/entreprises')}
                        className="py-2"
                      >
                        <span className="text-sm">Entreprises</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
