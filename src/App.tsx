import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ToastContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import PrivateAdminRoute from '@/components/PrivateAdminRoute';
import Clients from "./pages/Clients";
import AddClient from "./pages/AddClient";
import ClientDetail from "./pages/ClientDetail";
import Rentals from "./pages/Rentals";
import AddRental from "./pages/AddRental";
import EditRental from "./pages/EditRental";
import RentalDetail from "./pages/RentalDetail";
import Payments from "./pages/Payments";
import AddPayment from "./pages/AddPayment";
import Deposits from "./pages/Deposits";
import PaymentHistory from "./pages/PaymentHistory";
import PaymentReceipts from "./pages/PaymentReceipts";
import ClientDossier from "./pages/ClientDossier";
import SignedContracts from "./pages/SignedContracts";
import Documents from "./pages/Documents";
import ArchivedClients from "./pages/ArchivedClients";
import BlacklistedClients from "./pages/BlacklistedClients";
import Archive from "./pages/Archive";
import { Work } from "./pages/Work";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />

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
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
