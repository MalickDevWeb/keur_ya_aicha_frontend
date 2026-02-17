import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/stores/DataProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ToastContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineSyncBadge } from "@/components/OfflineSyncBadge";
import { MainLayout } from "@/layouts/MainLayout";
import Login from "./pages/common/Login";
import Dashboard from "./pages/admin/Dashboard";
import Settings from "./pages/admin/Settings";
import PrivateAdminRoute from '@/components/PrivateAdminRoute';
import ImportClients from "./pages/admin/ImportClients";
import ImportErrors from "./pages/admin/ImportErrors";
import ImportSuccess from "./pages/admin/ImportSuccess";
import Clients from "./pages/admin/Clients";
import AddClient from "./pages/admin/AddClient";
import ClientDetail from "./pages/admin/ClientDetail";
import Rentals from "./pages/admin/Rentals";
import AddRental from "./pages/admin/AddRental";
import EditRental from "./pages/admin/EditRental";
import RentalDetail from "./pages/admin/RentalDetail";
import Payments from "./pages/admin/Payments";
import AddPayment from "./pages/admin/AddPayment";
import Deposits from "./pages/admin/Deposits";
import PaymentHistory from "./pages/admin/PaymentHistory";
import PaymentReceipts from "./pages/admin/PaymentReceipts";
import AdminSubscriptionPayments from "./pages/admin/AdminSubscriptionPayments";
import ClientDossier from "./pages/admin/ClientDossier";
import SignedContracts from "./pages/admin/SignedContracts";
import Documents from "./pages/admin/Documents";
import ArchivedClients from "./pages/admin/ArchivedClients";
import BlacklistedClients from "./pages/admin/BlacklistedClients";
import Archive from "./pages/admin/Archive";
import { Work } from "./pages/admin/Work";
import NotFound from "./pages/common/NotFound";
import SuperAdminPage from "./pages/super-admin/SuperAdminPage";
import EntreprisesPage from "./pages/super-admin/Entreprises";
import AdminsPage from "./pages/super-admin/admins/AdminsPage";
import SuperAdminStatsPage from "./pages/super-admin/SuperAdminStats";
import NotificationsPage from "./pages/super-admin/notifications/NotificationsPage";
import SuperAdminSettingsPage from "./pages/super-admin/settings/SuperAdminSettingsPage";
import LogsPage from "./pages/super-admin/logs/LogsPage";
import RequestsPage from "./pages/super-admin/monitoring/RequestsPage";
import PerformancePage from "./pages/super-admin/monitoring/PerformancePage";
import AdminSignup from "./pages/common/AdminSignup";
import DangerClients from "./pages/admin/DangerClients";
import {
  OFFLINE_SYNC_QUEUE_UPDATED_EVENT,
  syncQueuedActions,
} from "@/infrastructure/syncQueue";

const queryClient = new QueryClient();
const isElectronDesktop =
  typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent);
const Router = isElectronDesktop ? HashRouter : BrowserRouter;

const App = () => {
  useEffect(() => {
    let isSyncRunning = false
    const runSync = async () => {
      if (isSyncRunning) return
      if (typeof navigator !== "undefined" && navigator.onLine === false) return
      isSyncRunning = true
      try {
        await syncQueuedActions()
      } catch {
        // ignore sync errors, queue will retry on next online event
      } finally {
        isSyncRunning = false
      }
    }

    const handleOnline = () => {
      void runSync()
    }
    const handleQueueUpdated = () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return
      void runSync()
    }
    let intervalId: number | null = null

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
      window.addEventListener(OFFLINE_SYNC_QUEUE_UPDATED_EVENT, handleQueueUpdated)
      intervalId = window.setInterval(() => {
        void runSync()
      }, 30_000)
    }

    if (typeof navigator !== "undefined" && navigator.onLine) {
      void runSync()
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener(OFFLINE_SYNC_QUEUE_UPDATED_EVENT, handleQueueUpdated)
        if (intervalId !== null) {
          window.clearInterval(intervalId)
        }
      }
    }
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <DataProvider>
              <ToastProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <ToastContainer />
                <OfflineSyncBadge />
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/signup" element={<AdminSignup />} />
                  <Route path="/pmt/admin" element={<SuperAdminPage />} />
                  <Route path="/pmt/admin/entreprises" element={<EntreprisesPage />} />
                  <Route path="/pmt/admin/admins" element={<AdminsPage />} />
                  <Route path="/pmt/admin/stats" element={<SuperAdminStatsPage />} />
                  <Route path="/pmt/admin/notifications" element={<NotificationsPage />} />
                  <Route path="/pmt/admin/settings" element={<SuperAdminSettingsPage />} />
                  <Route path="/pmt/admin/logs" element={<LogsPage />} />
                  <Route path="/pmt/admin/monitoring/requests" element={<RequestsPage />} />
                  <Route path="/pmt/admin/monitoring/performance" element={<PerformancePage />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/import/clients" element={<ImportClients />} />
                    <Route path="/import/errors" element={<ImportErrors />} />
                    <Route path="/import/success" element={<ImportSuccess />} />

                    {/* Clients Routes */}
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/add" element={<AddClient />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/clients/:id/edit" element={<AddClient />} />
                    <Route path="/clients/:id/add-rental" element={<AddRental />} />

                    {/* Rentals Routes */}
                    <Route path="/rentals" element={<Rentals />} />
                    <Route path="/rentals/add" element={<AddRental />} />
                    <Route path="/rentals/add/:clientId" element={<AddRental />} />
                    <Route path="/rentals/:id" element={<RentalDetail />} />
                    <Route path="/rentals/:id/edit" element={<EditRental />} />

                    {/* Payments Routes - Note: IDs can contain dashes like client-6-rental-1 */}
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/payments/add" element={<AddPayment />} />
                    <Route path="/payments/add/:clientId" element={<AddPayment />} />
                    <Route path="/payments/add/:clientId/:rentalId" element={<AddPayment />} />
                    <Route path="/payments/:rentalId/edit/:paymentId" element={<AddPayment />} />
                    <Route path="/payments/edit/:paymentId" element={<AddPayment />} />
                    <Route path="/payments/:rentalId" element={<RentalDetail />} />
                    <Route path="/payments/deposit" element={<Deposits />} />
                    <Route path="/payments/deposit/:rentalId/edit" element={<Deposits />} />
                    <Route path="/payments/deposit/:rentalId" element={<Deposits />} />
                    <Route path="/payments/history" element={<PaymentHistory />} />
                    <Route path="/payments/receipts" element={<PaymentReceipts />} />
                    <Route path="/subscription" element={<AdminSubscriptionPayments />} />

                    {/* Documents & Archive Routes */}
                    <Route path="/documents/dossiers" element={<ClientDossier />} />
                    <Route path="/documents/contracts" element={<SignedContracts />} />
                    <Route path="/documents/archive" element={<Documents />} />
                    <Route path="/documents/receipts" element={<PaymentReceipts />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/documents/:id/edit" element={<Documents />} />
                    <Route path="/archive" element={<ArchivedClients />} />
                    <Route path="/archive/clients" element={<ArchivedClients />} />
                    <Route path="/archive/blacklist" element={<BlacklistedClients />} />

                    {/* Settings & Archive */}
                    <Route path="/settings" element={
                      <PrivateAdminRoute>
                        <Settings />
                      </PrivateAdminRoute>
                    } />
                    <Route path="/archive" element={<Archive />} />
                    <Route path="/work" element={<Work />} />
                    <Route path="/danger/clients" element={<DangerClients />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
              </TooltipProvider>
            </ToastProvider>
          </DataProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App;
