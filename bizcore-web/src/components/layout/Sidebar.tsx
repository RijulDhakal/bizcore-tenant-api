import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  BarChart2,
  LogOut, 
  Package,
  ShoppingCart,
  Monitor,
  Clock,
  FolderKanban,
  UserCog,
  Settings as SettingsIcon,
  X,
  Receipt,
  Landmark,
  FileCheck2,
  AlertTriangle,
  MessageSquare,
  Building2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { clsx } from 'clsx';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, business, logout, isStaff } = useAuthStore();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const role = user?.role;
  const canAccessMyWork = role !== 0;
  const canAccessHR = role === 1 || role === 5 || role === 6;

  const menuConfig = {
    owner: ['dashboard', 'sales', 'finance', 'inventory', 'hr-management', 'reports', 'settings'],
    admin: ['dashboard', 'sales', 'finance', 'inventory', 'hr-management'],
    hr: ['dashboard', 'my-work', 'hr-management'],
    accountant: ['dashboard', 'finance', 'reports'],
    sales: ['dashboard', 'sales', 'partners'],
    pos: ['dashboard', 'pos'],
  };

  const roleMenuKey = role === 5 ? 'owner' : role === 1 ? 'admin' : role === 6 ? 'hr' : role === 2 ? 'accountant' : role === 3 ? 'sales' : role === 4 ? 'pos' : 'sales';
  const allowedSections = new Set((menuConfig as any)[roleMenuKey] ?? []);

  const navGroups = [
    {
      label: 'BUSINESS',
      key: 'dashboard',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: can('viewDashboard') },
        { to: '/khata', label: 'Digital Khata', icon: BookOpen, show: can('viewKhata') },
        { to: '/contacts', label: 'Contacts', icon: Users, show: can('viewContacts') },
        { to: '/invoices', label: 'Invoices', icon: FileText, show: can('viewInvoices') },
        { to: '/settings?tab=business', label: 'Business Profile', icon: Building2, show: true },
      ],
    },
    {
      label: 'MY WORK',
      key: 'my-work',
      items: [
        { to: '/hr/my-attendance', label: 'My Attendance', icon: Clock, show: canAccessMyWork && isStaff() },
        { to: '/hr/my-leaves', label: 'My Leaves', icon: FileText, show: canAccessMyWork && isStaff() },
        { to: '/hr/my-payslips', label: 'My Payslips', icon: Receipt, show: canAccessMyWork && isStaff() },
        { to: '/hr/assistance', label: 'HR Assistance', icon: MessageSquare, show: canAccessMyWork && isStaff() },
      ],
    },
    {
      label: 'OPERATIONS',
      key: 'inventory',
      items: [
        { to: '/inventory', label: 'Inventory', icon: Package, show: can('viewInventory') },
        { to: '/purchase', label: 'Purchase', icon: ShoppingCart, show: can('viewPurchase') },
        { to: '/pos', label: 'Point of Sale', icon: Monitor, show: can('usePOS') },
        { to: '/damaged-goods', label: 'Damaged Goods', icon: AlertTriangle, show: can('viewDamagedGoods') },
      ],
    },
    {
      label: 'PEOPLE',
      key: 'hr-management',
      items: [
        { to: '/hr', label: 'HR Management', icon: UserCog, show: canAccessHR && can('viewHR') },
        { to: '/projects', label: 'Projects', icon: FolderKanban, show: true },
      ],
    },
    {
      label: 'INSIGHTS',
      key: 'reports',
      items: [
        { to: '/reports', label: 'Reports', icon: BarChart2, show: can('viewReports') },
        { to: '/expenses', label: 'Expenses', icon: Receipt, show: can('viewExpenses') },
        { to: '/cashbook', label: 'Cash Book', icon: Landmark, show: can('viewFinancialReports') },
        { to: '/vat-report', label: 'VAT Report', icon: FileCheck2, show: can('viewFinancialReports') },
      ],
    },
  ];

  const businessName = business?.name ?? 'BizCore';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside 
      className={clsx(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] transition-all duration-300 ease-in-out lg:relative shadow-2xl overflow-hidden theme-transition",
        isOpen ? "w-72" : "w-24 -translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-20 items-center justify-between px-6 border-b border-[var(--sidebar-border)]/50 bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F6EF7] to-[#3B5BDB] font-black text-white shrink-0 shadow-lg shadow-[#4F6EF7]/20 uppercase italic border border-white/10">
            {businessName?.charAt(0) || 'B'}
          </div>
          <div className={clsx("flex flex-col whitespace-nowrap theme-transition", !isOpen && "lg:opacity-0 lg:pointer-events-none")}>
            <span className="text-sm font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none truncate max-w-[160px] italic">
              {businessName || 'BizCore Native'}
            </span>
            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1.5 opacity-80">
              Business Suite
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="flex lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2.5 hover:bg-[var(--bg-elevated)] rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-4 p-5 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => {
          if (!allowedSections.has((group as any).key) && (group as any).key !== 'my-work') return null;
          const visibleItems = group.items.filter((item) => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-2">
              <p className={clsx("px-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]", !isOpen && "lg:opacity-0")}>{group.label}</p>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-300 group relative border",
                    isActive
                      ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] border-[var(--nav-active-text)]/20 shadow-sm shadow-[#4F6EF7]/5"
                      : "text-[var(--text-secondary)] border-transparent hover:bg-[var(--nav-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]/50"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={clsx("shrink-0 transition-transform duration-300", "group-hover:scale-110 group-hover:rotate-3")} />
                      <span className={clsx("text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap", !isOpen && "lg:opacity-0 lg:pointer-events-none lg:w-0")}>
                        {item.label}
                      </span>
                      {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[var(--nav-active-text)] shadow-[0_0_8px_var(--nav-active-text)]" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto bg-[var(--sidebar-bg)]/80 backdrop-blur-md pb-6 px-5 space-y-4">
        <div className="h-px bg-[var(--sidebar-border)]/50 w-full" />
        
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) => clsx(
            "flex w-full items-center gap-4 rounded-xl px-4 py-3.5 transition-all font-black text-[10px] uppercase tracking-[0.2em] group border",
            isActive 
              ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] border-[var(--nav-active-text)]/20 shadow-sm" 
              : "text-[var(--text-secondary)] border-transparent hover:bg-[var(--nav-hover)] hover:text-[var(--text-primary)]"
          )}
        >
          <SettingsIcon size={18} className="shrink-0 transition-transform group-hover:rotate-90 duration-500" />
          <span className={clsx("transition-all duration-300", !isOpen && "lg:opacity-0 lg:pointer-events-none lg:w-0")}>Settings</span>
        </NavLink>

        <div className={clsx("flex items-center gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl transition-all shadow-sm", !isOpen && "lg:px-2")}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#4F6EF7] to-[#3B5BDB] flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-[#4F6EF7]/20 border border-white/10 italic text-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0] || 'U'}
          </div>
          <div className={clsx("flex-1 min-w-0 transition-all duration-300", !isOpen && "lg:opacity-0 lg:pointer-events-none lg:w-0")}>
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-none">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}</p>
            <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest truncate mt-1.5 leading-none">{user?.email || 'user@bizcore.com'}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-black text-[10px] uppercase tracking-[0.25em] group border border-transparent hover:border-rose-500/20"
        >
          <LogOut size={18} className="shrink-0 transition-transform group-hover:-translate-x-1" />
          <span className={clsx("transition-all duration-300", !isOpen && "lg:opacity-0 lg:pointer-events-none lg:w-0")}>Logout</span>
        </button>
      </div>
    </aside>
  );
};
