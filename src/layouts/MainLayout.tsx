import { ReactNode, useEffect, useMemo, useRef } from 'react';
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

type SubscriptionBlockedDetail = {
  error?: string
  overdueMonth?: string
  dueAt?: string
}

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading, user, impersonation, clearImpersonation } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isSuperAdminRoute = location.pathname.startsWith('/pmt/admin');
  const isSubscriptionRoute = location.pathname === '/subscription';
  const lastSubscriptionToastAtRef = useRef(0)

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

    window.addEventListener('admin-subscription-blocked', onSubscriptionBlocked)
    return () => {
      window.removeEventListener('admin-subscription-blocked', onSubscriptionBlocked)
    }
  }, [location.pathname, navigate, toast, user?.role])

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
                Super Admin
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
