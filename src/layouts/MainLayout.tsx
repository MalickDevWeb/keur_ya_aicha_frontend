import { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return t('nav.dashboard');
    if (path === '/clients') return t('nav.clients');
    if (path.includes('/clients/add')) return t('nav.addClient');
    if (path.includes('/clients/')) return t('clients.details');
    if (path === '/settings') return t('nav.settings');
    return '';
  };

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
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
