import { ReactNode, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { updateAdmin, updateUser } from '@/services/api';
import { AdminStatus } from '@/dto/frontend/responses';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading, user, impersonation, clearImpersonation } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isSuperAdminRoute = location.pathname.startsWith('/pmt/admin');

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
                <SidebarTrigger className="lg:hidden" />
                <h2 className="font-semibold text-lg hidden sm:block">{getPageTitle()}</h2>
              </div>
              <LanguageSelector />
            </header>
          ) : null}

          {/* Main Content */}
          <main className={`flex-1 overflow-auto scrollbar-thin ${showAdminNav ? 'p-4 lg:p-6' : 'p-4 md:p-6'}`}>
            {isSuperAdmin && impersonation && (
              <div className="mb-4 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white shadow-lg">
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-blue-200">Mode Super Admin</p>
                    <p className="text-base font-semibold">Espace de {impersonation.adminName}</p>
                    <p className="text-xs text-blue-200">Actions rapides sur le statut du compte</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-white/10 text-white hover:bg-white/20" onClick={() => setAdminStatus('SUSPENDU')}>
                      Suspendre
                    </Button>
                    <Button size="sm" className="bg-white/10 text-white hover:bg-white/20" onClick={() => setAdminStatus('BLACKLISTE')}>
                      Blacklister
                    </Button>
                    <Button size="sm" className="bg-white/10 text-white hover:bg-white/20" onClick={() => setAdminStatus('ARCHIVE')}>
                      Archiver
                    </Button>
                    <Button size="sm" className="bg-emerald-500/90 text-white hover:bg-emerald-500" onClick={() => setAdminStatus('ACTIF')}>
                      Restaurer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/10"
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
