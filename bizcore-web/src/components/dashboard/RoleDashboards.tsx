import { TrendingUp, FileText, Plus, Bell, Clock, ShoppingBag, Monitor, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface DashboardProps {
  user: any;
  stats: any[];
  isLoading: boolean;
  quickActions: any[];
  recentInvoices: any[];
}

export const OwnerDashboardView = ({ stats, isLoading, quickActions, recentInvoices }: DashboardProps) => {
  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))
        ) : (
          stats.map((stat, i) => (
            <Card key={i} className="relative overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 dark:border dark:border-slate-800 group hover:scale-[1.02] transition-all duration-500 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500`}>
                    <stat.icon size={24} />
                  </div>
                  <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 font-bold">
                    +12%
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {stat.isCurrency ? `NPR ${stat.value.toLocaleString()}` : stat.value.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden bg-slate-900 dark:bg-slate-900 dark:border dark:border-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Plus className="text-indigo-400" /> Executive Actions
            </CardTitle>
            <CardDescription className="text-slate-400 dark:text-slate-500 font-medium">Core business operations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            {quickActions.map((action, i) => (
              <Button 
                key={i}
                variant="ghost" 
                className="w-full justify-start h-14 bg-white/5 hover:bg-white/10 text-white border-white/5 hover:border-white/20 rounded-2xl group transition-all"
                onClick={() => window.location.href = action.path}
              >
                <div className="p-2 rounded-xl bg-white/10 group-hover:bg-indigo-500 transition-colors mr-3">
                  <action.icon size={18} />
                </div>
                <span className="font-bold">{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden dark:bg-slate-900 dark:border dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-800">
            <div>
              <CardTitle className="text-xl font-black dark:text-white">Recent Financial Activity</CardTitle>
              <CardDescription className="font-medium dark:text-slate-400">Latest invoices and transactions</CardDescription>
            </div>
            <Button variant="outline" className="rounded-xl font-bold text-xs dark:border-slate-700 dark:text-slate-300">View Report</Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-slate-100 dark:divide-slate-800">
               {recentInvoices.map((inv, i) => (
                 <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                   <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <FileText size={20} />
                     </div>
                     <div>
                       <p className="font-black text-slate-900 dark:text-white">INV-{inv.invoiceNumber}</p>
                       <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{inv.customerName}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-black text-slate-900 dark:text-white font-mono">NPR {inv.totalAmount.toLocaleString()}</p>
                     <Badge variant="outline" className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10">Settled</Badge>
                   </div>
                 </div>
               ))}
               {recentInvoices.length === 0 && (
                 <div className="p-10 text-center text-slate-400 font-medium">No recent invoices found.</div>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const HRDashboardView = ({ stats, isLoading, quickActions: _quickActions, recentInvoices: _recentInvoices }: DashboardProps) => {
  const iconStyles = ['bg-indigo-50 text-indigo-600', 'bg-orange-50 text-orange-600', 'bg-emerald-50 text-emerald-600', 'bg-violet-50 text-violet-600'];
  return (
    <div className="space-y-8">
      {/* HR Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        )) : stats.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl group hover:scale-[1.02] transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-4 rounded-2xl ${iconStyles[i % iconStyles.length].replace('bg-', 'bg-').replace('text-', 'text-')} dark:bg-slate-800 dark:text-slate-300`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.isCurrency ? `NPR ${Number(stat.value || 0).toLocaleString()}` : Number(stat.value || 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-black">HR Management Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 rounded-2xl border-slate-100 flex-col gap-2 hover:bg-slate-50 hover:border-indigo-200 transition-all group">
              <Plus className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="font-black text-[10px] uppercase">Add Employee</span>
            </Button>
            <Button variant="outline" className="h-24 rounded-2xl border-slate-100 flex-col gap-2 hover:bg-slate-50 hover:border-orange-200 transition-all group">
              <FileText className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="font-black text-[10px] uppercase">Generate Payroll</span>
            </Button>
            <Button variant="outline" className="h-24 rounded-2xl border-slate-100 flex-col gap-2 hover:bg-slate-50 hover:border-emerald-200 transition-all group">
              <UserCheck size={24} className="h-6 w-6 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="font-black text-[10px] uppercase">Approve Leaves</span>
            </Button>
            <Button variant="outline" className="h-24 rounded-2xl border-slate-100 flex-col gap-2 hover:bg-slate-50 hover:border-violet-200 transition-all group">
              <Bell className="h-6 w-6 text-violet-500 group-hover:scale-110 transition-transform" />
              <span className="font-black text-[10px] uppercase">View Inbox</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          <CardHeader>
             <CardTitle className="text-xl font-black">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-emerald-800 text-[10px] uppercase tracking-widest">Present Today</span>
                <span className="text-2xl font-black text-emerald-900">0</span>
             </div>
             <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                <span className="font-bold text-rose-800 text-[10px] uppercase tracking-widest">Absent Today</span>
                <span className="text-2xl font-black text-rose-900">0</span>
             </div>
             <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                <span className="font-bold text-amber-800 text-[10px] uppercase tracking-widest">Late Arrivals</span>
                <span className="text-2xl font-black text-amber-900">0</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const FinanceDashboardView = ({ stats, quickActions, recentInvoices }: DashboardProps) => {
  return (
    <div className="space-y-8">
      {/* Finance Specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl">
            <CardContent className="p-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {stat.isCurrency ? `NPR ${stat.value.toLocaleString()}` : stat.value.toLocaleString()}
                    </p>
                  </div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Invoices */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-800">
            <CardTitle className="text-xl font-black dark:text-white">Invoice Management</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-slate-100 dark:divide-slate-800">
               {recentInvoices.map((inv, i) => (
                 <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                   <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <FileText size={20} />
                     </div>
                     <div>
                       <p className="font-black text-slate-900 dark:text-white">INV-{inv.invoiceNumber}</p>
                       <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{inv.customerName}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-black text-slate-900 dark:text-white">NPR {inv.totalAmount.toLocaleString()}</p>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

        {/* Action Center */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden bg-slate-900 dark:bg-slate-900 dark:border dark:border-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-black text-emerald-400">Finance Workdesk</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
             {quickActions.map((action, i) => (
               <Button key={i} variant="secondary" className="justify-start h-14 rounded-2xl font-black tracking-tight bg-white/5 dark:bg-slate-800 hover:bg-white/10 dark:hover:bg-slate-700 text-white border-none" onClick={() => window.location.href=action.path}>
                 <action.icon className="mr-3 text-emerald-600 dark:text-emerald-400" size={18} /> {action.label}
               </Button>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const SalesDashboardView = ({ quickActions, recentInvoices }: DashboardProps) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden group">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px] relative overflow-hidden">
             <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl group-hover:scale-110 transition-transform duration-700" />
             <div className="h-24 w-24 rounded-[2rem] bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-inner mb-6 ring-4 ring-white/10 group-hover:scale-110 transition-transform">
               <ShoppingBag size={48} className="text-white drop-shadow-lg" />
             </div>
             <h3 className="text-4xl font-black tracking-tighter mb-2">POS Ready</h3>
             <p className="text-indigo-100 font-medium opacity-80 mb-8 max-w-[200px]">System secure and ready for transactions</p>
             <Button 
               size="lg" 
               className="w-full bg-white text-indigo-700 hover:bg-slate-50 rounded-2xl h-16 font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95"
               onClick={() => window.location.href = '/pos'}
             >
               <Monitor className="mr-3" /> OPEN POS TERMINAL
             </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black dark:text-white">Sales Performance</CardTitle>
                <CardDescription className="font-semibold dark:text-slate-400">Your recent transactions today</CardDescription>
              </div>
              <TrendingUp className="text-emerald-500" />
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentInvoices.slice(0, 3).map((inv, i) => (
                    <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{inv.customerName}</p>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{inv.invoiceNumber}</p>
                          </div>
                       </div>
                       <p className="font-black text-slate-900 dark:text-white">NPR {inv.totalAmount.toLocaleString()}</p>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {quickActions.filter(a => a.path !== '/pos').map((action, i) => (
                <Button key={i} variant="outline" className="h-20 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg dark:hover:shadow-none transition-all font-black text-xs uppercase dark:text-slate-200" onClick={() => window.location.href=action.path}>
                  <action.icon className="mr-3 h-5 w-5 text-indigo-600 dark:text-indigo-400" /> {action.label}
                </Button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const POSDashboardView = (_props: DashboardProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardContent className="p-8">
          <div className="h-20 w-20 rounded-3xl bg-white/10 flex items-center justify-center mb-6">
            <Monitor size={40} />
          </div>
          <h3 className="text-3xl font-black tracking-tight">Quick POS Screen</h3>
          <p className="mt-2 text-slate-300 text-sm">Jump directly into checkout with a single action.</p>
          <Button
            size="lg"
            className="mt-8 h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black"
            onClick={() => window.location.href = '/pos/terminal'}
          >
            <Monitor className="mr-2" /> Open POS Terminal
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-black dark:text-white">Operator Checklist</CardTitle>
          <CardDescription className="font-medium dark:text-slate-400">Start shift, run sales, close with summary.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">1. Verify terminal connectivity</div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">2. Confirm product sync and pricing</div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">3. Start billing and collect payments</div>
        </CardContent>
      </Card>
    </div>
  );
};

export const StaffDashboardView = ({ user: _user }: DashboardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-indigo-600 text-white overflow-hidden group">
        <CardContent className="p-8 relative">
          <Clock className="absolute top-4 right-4 h-24 w-24 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          <h3 className="text-2xl font-black tracking-tight mb-2">My Attendance</h3>
          <p className="text-indigo-100 font-medium mb-6">Status: <span className="text-emerald-300 font-black">SIGNED IN</span></p>
          <Button variant="secondary" className="w-full rounded-2xl font-black h-12" onClick={() => window.location.href='/hr/my-attendance'}>View History</Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl overflow-hidden">
        <CardHeader>
           <CardTitle className="text-xl font-black dark:text-white">Leave Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           {[
             { label: 'Annual', total: 18, used: 4 },
             { label: 'Sick', total: 12, used: 2 },
           ].map((leave, i) => (
             <div key={i} className="space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                 <span>{leave.label} Leave</span>
                 <span>{leave.total - leave.used} remaining</span>
               </div>
               <div className="h-3 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                 <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(leave.used / leave.total) * 100}%` }} />
               </div>
             </div>
           ))}
           <Button variant="outline" className="w-full rounded-2xl mt-4 font-black h-12 border-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => window.location.href='/hr/my-leaves'}>Request Leave</Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl border-l-[6px] border-l-violet-500">
        <CardHeader>
           <CardTitle className="text-xl font-black dark:text-white">HR Assistance</CardTitle>
           <CardDescription className="font-semibold text-slate-400 dark:text-slate-500">Need help with payroll or policy?</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Bell size={18} />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 italic">"Your payslip for March is ready."</p>
           </div>
           <Button className="w-full rounded-2xl h-12 bg-slate-900 dark:bg-indigo-600 font-black hover:bg-slate-800 dark:hover:bg-indigo-700" onClick={() => window.location.href='/hr/assistance'}>Message HR Support</Button>
        </CardContent>
      </Card>
    </div>
  );
};
