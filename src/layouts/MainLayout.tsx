import { ReactNode, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { updateAdmin, updateUser, AdminStatus } from '@/services/api';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading, user, impersonation, clearImpersonation } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  // Memoize isSuperAdmin check - placed before early returns to ensure consistent hooks order
  const isSuperAdmin = useMemo(() => String(user?.role || '').toUpperCase() === 'SUPER_ADMIN', [user?.role]);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return t('nav.dashboard');
    if (path === '/clients') return t('nav.clients');
    if (path.includes('/clients/add')) return t('nav.addClient');
    if (path.includes('/clients/')) return t('clients.details');
    if (path === '/settings') return t('nav.settings');
    if (path === '/pmt/admin') return 'Super Admin';
    return '';
  };

  const setAdminStatus = async (status: AdminStatus) => {
    if (!impersonation) return;
    await updateAdmin(impersonation.adminId, { status });
    if (impersonation.userId) {
      await updateUser(impersonation.userId, { status });
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h2 className="font-semibold text-lg hidden sm:block">{getPageTitle()}</h2>
            </div>
            <LanguageSelector />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto scrollbar-thin">
            {isSuperAdmin && impersonation && (
              <div className="mb-4 rounded-lg border bg-amber-50 text-amber-950 p-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  Mode Super Admin — Espace de {impersonation.adminName}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setAdminStatus('SUSPENDU')}>Suspendre</Button>
                  <Button size="sm" variant="secondary" onClick={() => setAdminStatus('BLACKLISTE')}>Blacklister</Button>
                  <Button size="sm" variant="secondary" onClick={() => setAdminStatus('ARCHIVE')}>Archiver</Button>
                  <Button size="sm" variant="outline" onClick={() => setAdminStatus('ACTIF')}>Restaurer</Button>
                  <Button size="sm" variant="ghost" onClick={clearImpersonation}>Quitter</Button>
                </div>
              </div>
            )}
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
