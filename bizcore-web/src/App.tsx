import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from './components/ui/sonner';
import { usePermission } from './hooks/usePermission';
import type { Permission } from './config/rolePermissions';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import Inventory from './pages/Inventory';
import Purchase from './pages/Purchase';
import POS from './pages/POS';
import POSTerminal from './pages/POSTerminal';
import { Settings } from './pages/Settings';
import HR from './pages/HR';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Expenses from './pages/Expenses';
import CashBook from './pages/CashBook';
import DemandForecast from './pages/DemandForecast';
import TeamManagement from './pages/TeamManagement';
import Partners from './pages/Partners';
import VatReport from './pages/VatReport';
import { ChangePassword } from './pages/ChangePassword';
import MyAttendance from './pages/MyAttendance';
import MyLeaves from './pages/MyLeaves';
import HRAssistance from './pages/HRAssistance';
import MyPayslips from './pages/MyPayslips';
import BusinessProfile from './pages/BusinessProfile';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';
import { ModuleGuard } from './components/auth/ModuleGuard';

import { useThemeStore } from './store/useThemeStore';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const Khata = lazy(() => import('./pages/Khata').then((m) => ({ default: m.Khata })));
const Invoices = lazy(() => import('./pages/Invoices').then((m) => ({ default: m.Invoices })));
const Contacts = lazy(() => import('./pages/Contacts').then((m) => ({ default: m.Contacts })));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      retryDelay: 2000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

const RouteFallback = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      <p className="text-xs font-medium text-slate-500">Loading module...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ permission }: { permission?: Permission }) => {
  const { isAuthenticated, accessToken, hasHydrated, isBootstrapped, user } = useAuthStore();
  const { hasPermission } = usePermission();
  const location = useLocation();

  console.log('[ProtectedRoute]', { hasHydrated, isAuthenticated, hasToken: Boolean(accessToken), isBootstrapped, hasUser: Boolean(user) });

  if (!hasHydrated || (isAuthenticated && Boolean(accessToken) && !isBootstrapped)) {
    console.log('[ProtectedRoute] Blocking - returning null');
    return null;
  }

  if (!isAuthenticated || !accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isFirstLogin && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, accessToken, hasHydrated, isBootstrapped, user } = useAuthStore();
  if (!hasHydrated) return null;
  if (isAuthenticated && Boolean(accessToken) && !isBootstrapped) return null;
  if (!isAuthenticated || !accessToken || !user) return <>{children}</>;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  const { hasHydrated, isAuthenticated, accessToken, user, isBootstrapped, logout, initAuth } = useAuthStore();

  useEffect(() => {
    console.log('[DEBUG Auth State]', { hasHydrated, isAuthenticated, accessToken: Boolean(accessToken), user: Boolean(user), isBootstrapped });
  }, [hasHydrated, isAuthenticated, accessToken, user, isBootstrapped]);
  // Permission store loaded check - kept but not blocking bootstrap
  const bootstrapRef = useRef(false);
  const [bootstrapTimedOut, setBootstrapTimedOut] = useState(false);
  const { theme } = useThemeStore();

  const safeRedirectToLogin = (reason: string) => {
    const win = window as Window & { __resetTriggered?: boolean };
    if (window.location.pathname === '/login') return;
    if (win.__resetTriggered) return;
    win.__resetTriggered = true;
    console.warn(`[App] Redirecting to login: ${reason}`);
    window.location.replace('/login');
  };

  useEffect(() => {
    type ResetWindow = Window & {
      resetApp?: () => void;
      forceReset?: () => void;
    };

    const win = window as ResetWindow;

    const resetImpl = (useReplace: boolean) => {
      console.log(`[App] ${useReplace ? 'forceReset' : 'resetApp'} invoked`);
      try {
        logout();
      } catch {
        // Continue with storage clear fallback.
      }

      localStorage.clear();
      sessionStorage.clear();

      safeRedirectToLogin(useReplace ? 'force reset invoked' : 'manual reset invoked');

      // Ensure hard navigation even if SPA/router state is broken.
      setTimeout(() => {
        if (!window.location.pathname.includes('/login')) {
          safeRedirectToLogin('post-reset hard navigation fallback');
        }
      }, 50);
    };

    win.resetApp = () => resetImpl(false);
    win.forceReset = () => resetImpl(true);

    console.log('[App] Global reset handlers registered:', {
      resetApp: typeof win.resetApp,
      forceReset: typeof win.forceReset,
    });
  }, [logout]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !accessToken || isBootstrapped || bootstrapRef.current) return;

    bootstrapRef.current = true;
    console.log('[Bootstrap] Started from App effect');
    
    initAuth().then(() => {
      console.log('[Bootstrap] Done from App effect');
      setBootstrapTimedOut(false);
    })
      .catch((err: unknown) => {
        console.warn('[Bootstrap] Failed from App effect:', err);
        useAuthStore.setState({ isBootstrapped: true });
      })
      .finally(() => {
        bootstrapRef.current = false;
      });
  }, [hasHydrated, isAuthenticated, accessToken, isBootstrapped, initAuth]);



  if (!hasHydrated) {
    console.log('[RENDER] hasHydrated is FALSE - showing loading');
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading BizCore...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && Boolean(accessToken) && Boolean(user) && !isBootstrapped) {
    console.log('[RENDER] Waiting for bootstrap - showing loading');
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading BizCore...</p>
          {bootstrapTimedOut && (
            <p className="text-xs text-amber-600">Still preparing workspace. You can safely reset below.</p>
          )}
          <button
            onClick={() => {
              const win = window as Window & { forceReset?: () => void };
              if (typeof win.forceReset === 'function') {
                win.forceReset();
                return;
              }
              localStorage.clear();
              sessionStorage.clear();
              safeRedirectToLogin('manual timeout recovery click');
            }}
            className="text-xs text-primary underline mt-2 block mx-auto"
          >
            Taking too long? Click here
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-right" />
      <Router>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            <Route element={<ProtectedRoute />}>
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />

                <Route element={<ProtectedRoute permission="khata.view" />}>
                  <Route path="/khata" element={<ModuleGuard moduleCode="khata"><Khata /></ModuleGuard>} />
                </Route>

                <Route element={<ProtectedRoute permission="invoices.view" />}>
                  <Route path="/contacts" element={<ModuleGuard moduleCode="invoices"><Contacts /></ModuleGuard>} />
                  <Route path="/invoices" element={<ModuleGuard moduleCode="invoices"><Invoices /></ModuleGuard>} />
                  <Route path="/partners" element={<ModuleGuard moduleCode="invoices"><Partners /></ModuleGuard>} />
                </Route>

                <Route element={<ProtectedRoute permission="reports.view" />}>
                  <Route path="/reports" element={<ModuleGuard moduleCode="reports"><Reports /></ModuleGuard>} />
                  <Route path="/cashbook" element={<ModuleGuard moduleCode="reports"><CashBook /></ModuleGuard>} />
                  <Route path="/vat-report" element={<ModuleGuard moduleCode="reports"><VatReport /></ModuleGuard>} />
                </Route>

                <Route element={<ProtectedRoute permission="inventory.view" />}>
                  <Route path="/inventory" element={<ModuleGuard moduleCode="inventory"><Inventory /></ModuleGuard>} />
                  <Route path="/demand-forecast" element={<ModuleGuard moduleCode="inventory"><DemandForecast /></ModuleGuard>} />
                </Route>

                <Route element={<ProtectedRoute permission="purchase.view" />}>
                  <Route path="/purchase" element={<ModuleGuard moduleCode="purchase"><Purchase /></ModuleGuard>} />
                </Route>

                <Route element={<ProtectedRoute permission="pos.access" />}>
                  <Route path="/pos" element={<ModuleGuard moduleCode="pos"><POS /></ModuleGuard>} />
                </Route>

                <Route element={<ProtectedRoute permission="hr.view" />}>
                  <Route path="/hr" element={<ModuleGuard moduleCode="hr"><HR /></ModuleGuard>} />
                </Route>

                <Route path="/hr/my-attendance" element={<MyAttendance />} />
                <Route path="/hr/my-leaves" element={<MyLeaves />} />
                <Route path="/hr/my-payslips" element={<MyPayslips />} />
                <Route path="/hr/assistance" element={<HRAssistance />} />

                <Route element={<ProtectedRoute permission="projects.view" />}>
                  <Route path="/projects" element={<ModuleGuard moduleCode="projects"><Projects /></ModuleGuard>} />
                  <Route path="/projects/:id" element={<ModuleGuard moduleCode="projects"><ProjectDetail /></ModuleGuard>} />
                </Route>

                <Route element={<ProtectedRoute permission="expenses.view" />}>
                  <Route path="/expenses" element={<ModuleGuard moduleCode="expenses"><Expenses /></ModuleGuard>} />
                </Route>

                <Route element={<ProtectedRoute permission="team.manage" />}>
                  <Route path="/team" element={<TeamManagement />} />
                </Route>
                <Route element={<ProtectedRoute permission="settings.view" />}>
                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="/business-profile" element={<BusinessProfile />} />
              </Route>

              <Route element={<ProtectedRoute permission="pos.access" />}>
                <Route path="/pos/terminal" element={<ModuleGuard moduleCode="pos"><POSTerminal /></ModuleGuard>} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
