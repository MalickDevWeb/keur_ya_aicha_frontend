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
import { useState } from 'react';

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
        label: 'Dossiers Clients',
        icon: FileText,
        submenu: [
          { key: 'documentsList', label: 'Contrats signés', path: '/documents' },
          { key: 'documentsArchive', label: 'Documents', path: '/documents/archive' },
          { key: 'documentsReceipts', label: 'Reçus PDF', path: '/documents/receipts' },
        ]
      },
      {
        key: 'archive',
        label: 'Archivage & Blacklist',
        icon: Archive,
        submenu: [
          { key: 'archiveClients', label: 'Clients archivés', path: '/archive' },
          { key: 'blacklist', label: 'Blacklist', path: '/blacklist' },
        ]
      },
      { key: 'settings', label: 'Paramètres', path: '/settings', icon: Settings },
    ]
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { logout, user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [expandedItems, setExpandedItems] = useState<string[]>(['clients']);

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
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && <SidebarGroupLabel className="text-xs text-sidebar-foreground/60">{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isExpanded = expandedItems.includes(item.key);
                  const hasSubmenu = 'submenu' in item && item.submenu;
                  const activeSubmenu = hasSubmenu && item.submenu.some(sub => isActive(sub.path));

                  return (
                    <SidebarMenuItem key={item.key}>
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
                          {item.submenu.map((subitem) => (
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
                                {subitem.label}
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
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60">@{user.username}</p>
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
