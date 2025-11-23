import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { Layout } from './components/Layout';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { pushNotificationService } from './utils/push-notifications';
import { useAuthStore } from './store/auth.store';

// Lazy loading для страниц
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const GeoPage = lazy(() => import('./pages/GeoPage').then(m => ({ default: m.GeoPage })));
const CompetitorsPage = lazy(() => import('./pages/CompetitorsPage').then(m => ({ default: m.CompetitorsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const RefundPage = lazy(() => import('./pages/RefundPage').then(m => ({ default: m.RefundPage })));
const ApiPolicyPage = lazy(() => import('./pages/ApiPolicyPage').then(m => ({ default: m.ApiPolicyPage })));
const PaymentPage = lazy(() => import('./pages/PaymentPage').then(m => ({ default: m.PaymentPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const OptimizationPage = lazy(() => import('./pages/OptimizationPage').then(m => ({ default: m.OptimizationPage })));
const SyncPage = lazy(() => import('./pages/SyncPage').then(m => ({ default: m.SyncPage })));
const AIPage = lazy(() => import('./pages/AIPage').then(m => ({ default: m.AIPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const OrganizationsPage = lazy(() => import('./pages/OrganizationsPage').then(m => ({ default: m.OrganizationsPage })));
const ApiKeysPage = lazy(() => import('./pages/ApiKeysPage').then(m => ({ default: m.ApiKeysPage })));

function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Восстанавливаем сессию при загрузке приложения
    restoreSession();

    // Инициализируем Service Worker и Push Notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Инициализируем Push Notification Service
    pushNotificationService.initialize();
  }, [restoreSession]);
  const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <div>Загрузка...</div>
    </div>
  );

  // Показываем загрузку во время восстановления сессии
  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/geo" element={<GeoPage />} />
                    <Route path="/optimization" element={<OptimizationPage />} />
                    <Route path="/competitors" element={<CompetitorsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/sync" element={<SyncPage />} />
                    <Route path="/ai" element={<AIPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/organizations" element={<OrganizationsPage />} />
                    <Route path="/api-keys" element={<ApiKeysPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/refund" element={<RefundPage />} />
                    <Route path="/api-policy" element={<ApiPolicyPage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminPage />
                        </AdminRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <PWAInstallPrompt />
    </>
  );
}

export default App;

