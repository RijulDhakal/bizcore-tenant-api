import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Plus,
  Monitor,
  BookOpen,
  Package,
} from 'lucide-react';
import { Suspense, lazy } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { usePermission } from '../hooks/usePermission';
import { dashboardApi } from '../api/api';
import { getGreeting } from '../utils/format';
import { Badge } from '../components/ui/badge';
import { BusinessSetupModal } from '../components/BusinessSetupModal';
import { getNepaliFinancialYear } from '../utils/nepali';

const OwnerDashboardView = lazy(() => import('../components/dashboard/RoleDashboards').then((m) => ({ default: m.OwnerDashboardView })));
const HRDashboardView = lazy(() => import('../components/dashboard/RoleDashboards').then((m) => ({ default: m.HRDashboardView })));
const StaffDashboardView = lazy(() => import('../components/dashboard/RoleDashboards').then((m) => ({ default: m.StaffDashboardView })));
const FinanceDashboardView = lazy(() => import('../components/dashboard/RoleDashboards').then((m) => ({ default: m.FinanceDashboardView })));
const SalesDashboardView = lazy(() => import('../components/dashboard/RoleDashboards').then((m) => ({ default: m.SalesDashboardView })));
const POSDashboardView = lazy(() => import('../components/dashboard/RoleDashboards').then((m) => ({ default: m.POSDashboardView })));

type InvoiceLite = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  issueDate: string;
};

type OwnerDashboardData = {
  revenue: number;
  expenses: number;
  customers: number;
  employeeCount: number;
  pendingLeaves: number;
  profitLoss: number;
  recentInvoices: InvoiceLite[];
};

type FinanceDashboardData = {
  expenses: number;
  profitLoss: number;
  reports: number;
  outstanding: number;
  recentInvoices: InvoiceLite[];
};

type HrDashboardData = {
  leaveRequests: number;
  attendance: number;
  employeeCount: number;
  assistanceOpen: number;
};

type SalesDashboardData = {
  salesToday: number;
  customers: number;
  orders: number;
  recentInvoices: InvoiceLite[];
};

type PosDashboardData = {
  todayTransactions: number;
  todaySales: number;
  openSessions: number;
};

type DashboardResponse = Partial<OwnerDashboardData & FinanceDashboardData & HrDashboardData & SalesDashboardData & PosDashboardData> & {
  recentInvoices?: InvoiceLite[];
};

export const Dashboard = () => {
  const { user, business, isAuthenticated, hasHydrated, updateUser } = useAuthStore();
  const { hasPermission, role } = usePermission();
  const queryClient = useQueryClient();

  const isOwnerOrAdmin = role === 5 || role === 1;

  const isHR = role === 6;
  const isAccountant = role === 2;
  const isSales = role === 3;
  const isPOS = role === 4;

  const hasBusiness = Boolean(business && business.tenantId);
  const businessNotFound = !hasBusiness;

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getDashboard();
      return response.data?.data as DashboardResponse;
    },
    enabled: Boolean(isAuthenticated && hasHydrated && hasBusiness && (isOwnerOrAdmin || isHR || isAccountant || isSales || isPOS)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const isCheckingBusiness = false;
  const isLoading = isCheckingBusiness || dashboardQuery.isLoading;


  const handleSetupComplete = async (tenantId: string) => {
    if (tenantId) {
      updateUser({ currentTenantId: tenantId });
    }
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const kpiStats = (() => {
    const ownerData = dashboardQuery.data;
    const financeData = dashboardQuery.data;
    const hrData = dashboardQuery.data;
    const salesData = dashboardQuery.data;

    if (isOwnerOrAdmin) {
      return [
        { label: 'Total Revenue', value: Number(ownerData?.revenue ?? 0), icon: TrendingUp, isCurrency: true, description: 'Consolidated sales' },
        { label: 'Employees', value: Number(ownerData?.employeeCount ?? 0), icon: Users, isCurrency: false, description: 'Active headcount' },
        { label: 'Profit / Loss', value: Number(ownerData?.profitLoss ?? 0), icon: AlertCircle, isCurrency: true, description: 'Revenue minus expenses' },
        { label: 'Leave Requests', value: Number(ownerData?.pendingLeaves ?? 0), icon: FileText, isCurrency: false, description: 'Pending HR approvals' },
      ];
    }

    if (isHR) {
      return [
        { label: 'Leave Requests', value: Number(hrData?.leaveRequests ?? 0), icon: FileText, isCurrency: false, description: 'Pending approvals' },
        { label: 'Attendance', value: Number(hrData?.attendance ?? 0), icon: Users, isCurrency: false, description: 'Present today' },
        { label: 'Employee Count', value: Number(hrData?.employeeCount ?? 0), icon: Users, isCurrency: false, description: 'Current team size' },
        { label: 'HR Inbox', value: Number(hrData?.assistanceOpen ?? 0), icon: AlertCircle, isCurrency: false, description: 'Open assistance requests' },
      ];
    }

    if (isAccountant) {
      return [
        { label: 'Expenses', value: Number(financeData?.expenses ?? 0), icon: AlertCircle, isCurrency: true, description: 'Total expenses' },
        { label: 'Profit / Loss', value: Number(financeData?.profitLoss ?? 0), icon: TrendingUp, isCurrency: true, description: 'Current period net' },
        { label: 'Reports', value: Number(financeData?.reports ?? 0), icon: FileText, isCurrency: false, description: 'Financial records available' },
      ];
    }

    if (isSales) {
      return [
        { label: 'Sales Today', value: Number(salesData?.salesToday ?? 0), icon: TrendingUp, isCurrency: true, description: 'Today\'s performance' },
        { label: 'Customers', value: Number(salesData?.customers ?? 0), icon: Users, isCurrency: false, description: 'Reach and engagement' },
        { label: 'Orders', value: Number(salesData?.orders ?? 0), icon: FileText, isCurrency: false, description: 'Today\'s confirmed orders' },
      ];
    }

    if (isPOS) {
      return [];
    }

    return [
      { label: 'Total Revenue', value: 0, icon: TrendingUp, isCurrency: true, description: 'Last 30 days' },
    ];
  })();

  const recentInvoices = dashboardQuery.data?.recentInvoices ?? [];

  const quickActions = [
    { label: 'Create Invoice', icon: Plus, path: '/invoices', color: 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/10 dark:border-blue-900/20', permission: 'invoices.create' },
    { label: 'Add Khata Entry', icon: BookOpen, path: '/khata', color: 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/10 dark:border-green-900/20', permission: 'khata.create' },
    { label: 'Add to Inventory', icon: Package, path: '/inventory', color: 'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-900/10 dark:border-purple-900/20', permission: 'inventory.edit' },
    { label: 'Open POS', icon: Monitor, path: '/pos', color: 'bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-900/10 dark:border-orange-900/20', permission: 'pos.access' },
  ].filter(a => hasPermission(a.permission as any));

  if (isCheckingBusiness) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Loading personalized workspace...</p>
        </div>
      </div>
    );
  }

  const renderDashboardView = () => {
    // Role-based routing for dashboards
    if (role === 6) { // HR Manager
      return <HRDashboardView user={user} stats={kpiStats} isLoading={isLoading} quickActions={quickActions} recentInvoices={recentInvoices} />;
    }
    
    if (role === 2) { // Accountant
      return <FinanceDashboardView user={user} stats={kpiStats} isLoading={isLoading} quickActions={quickActions} recentInvoices={recentInvoices} />;
    }

    if (role === 3) { // Sales
       return <SalesDashboardView user={user} stats={kpiStats} isLoading={isLoading} quickActions={quickActions} recentInvoices={recentInvoices} />;
    }

    if (role === 4) { // POS Operator
       return <POSDashboardView user={user} stats={kpiStats} isLoading={isLoading} quickActions={quickActions} recentInvoices={recentInvoices} />;
    }

     if (role === 5 || role === 1) { // Owner or Admin
      return <OwnerDashboardView user={user} stats={kpiStats} isLoading={isLoading} quickActions={quickActions} recentInvoices={recentInvoices} />;
    }

    // Default staff view
    return <StaffDashboardView user={user} stats={kpiStats} isLoading={isLoading} quickActions={quickActions} recentInvoices={recentInvoices} />;
  };

  return (
    <div className="space-y-8 pb-10">
      {businessNotFound && <BusinessSetupModal onComplete={handleSetupComplete} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-in slide-in-from-left duration-500">
          <h2 className="text-3xl font-bold tracking-tight">{getGreeting()}, {user?.firstName}</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-muted-foreground font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
             <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">FY {getNepaliFinancialYear()}</Badge>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />}>
        {renderDashboardView()}
      </Suspense>
    </div>
  );
};
