import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  Package, 
  ShoppingCart, 
  Monitor, 
  UserCheck, 
  Clock,
  KanbanSquare, 
  BarChart2,
  CreditCard,
  Sparkles,
  MessageSquare,
  type LucideIcon
} from 'lucide-react';
import type { Permission } from './rolePermissions';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  moduleCode: string;
  permission: Permission;
  badge?: string;
}

export interface NavGroup {
  label: string;
  color: string;
  items: NavItem[];
}

export const NAVIGATION_CONFIG: NavGroup[] = [
  {
    label: "Dashboard",
    color: "text-slate-600",
    items: [
      { 
        label: "Market Overview", 
        icon: LayoutDashboard, 
        path: "/dashboard", 
        moduleCode: "dashboard", 
        permission: "khata.view" // Everyone with basic access
      },
    ]
  },
  {
    label: "SALES",
    color: "text-blue-600",
    items: [
      { 
        label: "Point of Sale", 
        icon: Monitor, 
        path: "/pos", 
        moduleCode: "pos", 
        permission: "pos.access" 
      },
      { 
        label: "Invoices", 
        icon: FileText, 
        path: "/invoices", 
        moduleCode: "invoices", 
        permission: "invoices.view" 
      },
      { 
        label: "Partners", 
        icon: Users, 
        path: "/partners", 
        moduleCode: "invoices", 
        permission: "partners.view" 
      },
    ]
  },
  {
    label: "FINANCE",
    color: "text-emerald-600",
    items: [
      { 
        label: "Digital Khata", 
        icon: BookOpen, 
        path: "/khata", 
        moduleCode: "khata", 
        permission: "khata.view" 
      },
      { 
        label: "Expenses", 
        icon: CreditCard, 
        path: "/expenses", 
        moduleCode: "expenses", 
        permission: "expenses.view" 
      },
      { 
        label: "Business Reports", 
        icon: BarChart2, 
        path: "/reports", 
        moduleCode: "reports", 
        permission: "reports.view",
        badge: "New"
      },
    ]
  },
  {
    label: "INVENTORY",
    color: "text-amber-600",
    items: [
      { 
        label: "Inventory", 
        icon: Package, 
        path: "/inventory", 
        moduleCode: "inventory", 
        permission: "inventory.view" 
      },
      { 
        label: "Purchase", 
        icon: ShoppingCart, 
        path: "/purchase", 
        moduleCode: "purchase", 
        permission: "purchase.view" 
      },
      { 
        label: "Demand AI", 
        icon: Sparkles, 
        path: "/demand-forecast", 
        moduleCode: "inventory", 
        permission: "inventory.view",
        badge: "AI"
      },
    ]
  },
  {
    label: "MY WORK",
    color: "text-indigo-600",
    items: [
      { 
        label: "My Attendance", 
        icon: Clock, 
        path: "/hr/my-attendance", 
        moduleCode: "hr", 
        permission: "self.work" 
      },
      { 
        label: "My Leaves", 
        icon: FileText, 
        path: "/hr/my-leaves", 
        moduleCode: "hr", 
        permission: "self.work" 
      },
      { 
        label: "My Payslips", 
        icon: CreditCard, 
        path: "/hr/my-payslips", 
        moduleCode: "hr", 
        permission: "self.work" 
      },
      { 
        label: "HR Assistance", 
        icon: MessageSquare as any, 
        path: "/hr/assistance", 
        moduleCode: "hr", 
        permission: "self.work" 
      },
    ]
  },
  {
    label: "PEOPLE",
    color: "text-violet-600",
    items: [
      { 
        label: "HR Management", 
        icon: UserCheck, 
        path: "/hr", 
        moduleCode: "hr", 
        permission: "hr.view" 
      },
      { 
        label: "Projects", 
        icon: KanbanSquare, 
        path: "/projects", 
        moduleCode: "projects", 
        permission: "projects.view" 
      },
    ]
  },
];
