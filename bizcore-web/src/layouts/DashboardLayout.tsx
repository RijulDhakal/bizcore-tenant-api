import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { usePermission } from '../hooks/usePermission';
import { 
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Building2,
  Search,
  PlusCircle,
} from 'lucide-react';
import {
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton,
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger,
  SidebarInset
} from '../components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { NAVIGATION_CONFIG } from '../config/navigation';

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const { user, business, logout } = useAuthStore();
  const { hasPermission, role } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User';
  const initials = displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase() || 'U';

  const myWorkPaths = new Set(['/hr/my-attendance', '/hr/my-leaves', '/hr/my-payslips', '/hr/assistance']);

  const navGroups = NAVIGATION_CONFIG
    .map(group => ({
      ...group,
      items: group.items.map(item => {
        const isSelfWork = myWorkPaths.has(item.path);
        const hasModulePermission = hasPermission(item.permission);
        
        return {
          ...item,
          isLocked: false,
          isVisible: role === 0 ? false : (isSelfWork || hasModulePermission)
        };
      }).filter(item => item.isVisible)
    }))
    .filter(group => group.items.length > 0);

  const getPageTitle = () => {
    const path = location.pathname;
    const item = NAVIGATION_CONFIG.flatMap(g => g.items).find(i => i.path === path);
    if (path === '/settings') return "System Configuration";
    if (path === '/team') return "Team Management";
    return item?.label || "BizCore Overview";
  };



  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Sidebar className="border-r border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-950 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300">
          <SidebarHeader className="border-b border-slate-100/80 dark:border-white/5 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 ring-2 ring-white dark:ring-white/10">
                B
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase">BizCore</span>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] mt-1.5">Enterprise</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-white/50 dark:bg-transparent backdrop-blur-sm pt-6">
            <div className="px-4 mb-4">
               <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 transition-all text-xs group"
              >
                <Search size={14} />
                <span className="flex-1 text-left font-medium">Quick Search...</span>
                <kbd className="hidden sm:inline-flex h-4 items-center gap-1 rounded border dark:border-slate-700 bg-white dark:bg-slate-800 px-1 font-mono text-[9px] font-medium text-slate-500 shadow-sm">
                  ⌘K
                </kbd>
              </button>
            </div>
            
            {navGroups.map((group, groupIdx) => (
              <SidebarGroup key={group.label} className={groupIdx > 0 ? "mt-4" : ""}>
                <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 px-7 mb-4">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="px-3 gap-1">
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={location.pathname === item.path}
                          className={`
                            h-11 px-4 rounded-2xl transition-all duration-300
                            ${location.pathname === item.path 
                              ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 dark:shadow-none' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                            }
                          `}
                        >
                          <a href={item.path} className="flex items-center gap-3">
                            <item.icon size={18} className={location.pathname === item.path ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"} />
                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 p-3 rounded-2xl hover:bg-white dark:hover:bg-white/5 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all group">
                  <Avatar className="h-10 w-10 rounded-xl ring-2 ring-white dark:ring-white/10 shadow-sm">
                    <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start overflow-hidden">
                    <span className="text-sm font-black text-slate-900 dark:text-white truncate w-full tracking-tight">{displayName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold truncate w-full uppercase tracking-tighter">{user?.email}</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-3xl p-2 shadow-2xl border-slate-200 dark:border-white/10 dark:bg-slate-900 backdrop-blur-xl">
                <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-2xl p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 focus:bg-slate-50 dark:focus:bg-white/5">
                  <Settings className="mr-3 h-4 w-4 text-slate-500" />
                  <span className="text-sm font-bold dark:text-slate-200">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-white/5" />
                <DropdownMenuItem onClick={logout} className="rounded-2xl p-3 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus:bg-rose-50 dark:focus:bg-rose-950/30">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-sm font-black uppercase tracking-tight">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="h-20 border-b border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="h-10 w-10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-400" />
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{getPageTitle()}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Building2 size={12} className="text-slate-400 dark:text-slate-600" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">{business?.name || 'Loading...'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
              </button>
              
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
              
              <button 
                onClick={() => navigate('/inventory?action=add-product')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <PlusCircle size={16} />
                <span>New Product</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 transition-colors">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
