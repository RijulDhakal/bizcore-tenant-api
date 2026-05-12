import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/api';
import { 
  TrendingUp, 
  ArrowDown, 
  ArrowUp, 
  Calendar,
  FileText,
  Briefcase,
  BarChart3,
  Clock,
  ChevronRight,
  Receipt,
  FileCheck2,
  Landmark,
  Calculator
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '../components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';

export const Reports = () => {
  const [params, setParams] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const { data: plData, isLoading: isPlLoading } = useQuery({
    queryKey: ['profit-loss', params],
    queryFn: () => reportApi.getProfitLoss(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const { data: outstandingData, isLoading: isOutstandingLoading } = useQuery({
    queryKey: ['outstanding'],
    queryFn: () => reportApi.getOutstanding(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

   const plRaw = plData?.data?.data ?? plData?.data ?? plData ?? {};
   const pl = {
      totalIncome: Number(plRaw?.totalIncome ?? plRaw?.TotalIncome ?? 0),
      totalExpenses: Number(plRaw?.totalExpenses ?? plRaw?.TotalExpenses ?? 0),
      netProfit: Number(plRaw?.netProfit ?? plRaw?.NetProfit ?? 0),
      profitRatio: Number(plRaw?.profitRatio ?? plRaw?.ProfitRatio ?? 0),
      invoiceIncome: Number(plRaw?.invoiceIncome ?? plRaw?.InvoiceIncome ?? 0),
      posIncome: Number(plRaw?.posIncome ?? plRaw?.PosIncome ?? 0),
   };

   const outstandingRaw = outstandingData?.data?.data ?? outstandingData?.data ?? outstandingData ?? [];
   const outstandingList = Array.isArray(outstandingRaw)
      ? outstandingRaw.map((item: any) => ({
            customerId: item?.customerId ?? item?.CustomerId,
            customerName: item?.customerName ?? item?.CustomerName ?? 'Customer',
            totalOutstanding: Number(item?.totalOutstanding ?? item?.TotalOutstanding ?? 0),
            invoiceCount: Number(item?.invoiceCount ?? item?.InvoiceCount ?? 0),
            invoices: item?.invoices ?? item?.Invoices ?? [],
         }))
      : [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Reports</h1>
          <p className="text-sm text-muted-foreground">Comprehensive analysis of your business performance.</p>
        </div>
        <div className="flex items-center gap-2">
           <Select 
            value={params.month.toString()} 
            onValueChange={(v) => setParams({ ...params, month: parseInt(v) })}
          >
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m, i) => (
                <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={params.year.toString()} 
            onValueChange={(v) => setParams({ ...params, year: parseInt(v) })}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={y.toString()}>{y.toString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profit & Loss Card */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-2">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                     <TrendingUp size={24} />
                  </div>
                  <div>
                     <CardTitle className="text-xl">Profit & Loss Statement</CardTitle>
                     <CardDescription className="text-sm mt-0.5">Financial performance summary</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6">
               {isPlLoading ? (
                  <div className="grid grid-cols-3 gap-4 mb-8">
                     <Skeleton className="h-24 w-full" />
                     <Skeleton className="h-24 w-full" />
                     <Skeleton className="h-24 w-full" />
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                     <div className="p-4 rounded-xl border bg-card">
                         <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                        <p className="text-2xl font-bold">{formatCurrency(pl.totalIncome || 0)}</p>
                        <Badge variant="outline" className="mt-2 text-[9px] border-emerald-200 bg-emerald-50 text-emerald-700">
                           <ArrowUp className="mr-1 h-3 w-3" /> Revenue
                        </Badge>
                     </div>
                     <div className="p-4 rounded-xl border bg-card">
                         <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                        <p className="text-2xl font-bold">{formatCurrency(pl.totalExpenses || 0)}</p>
                        <Badge variant="outline" className="mt-2 text-[9px] border-rose-200 bg-rose-50 text-rose-700">
                           <ArrowDown className="mr-1 h-3 w-3" /> Expenses
                        </Badge>
                     </div>
                     <div className={cn(
                        "p-4 rounded-xl border shadow-sm",
                        pl.netProfit > 0 ? "bg-emerald-600 text-white border-none" : pl.netProfit < 0 ? "bg-rose-600 text-white border-none" : "bg-gray-400 text-white border-none"
                     )}>
                         <p className="text-sm opacity-80 mb-1">Net Profit</p>
                        <p className="text-3xl font-black italic">{formatCurrency(pl.netProfit || 0)}</p>
                        <div className="mt-2 flex items-center justify-between text-xs opacity-90">
                           <span>Ratio:</span>
                           <span>{pl.profitRatio?.toFixed(1) || '0.0'}%</span>
                        </div>
                     </div>
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Income Breakdown</h3>
                        <div className="h-px flex-1 mx-4 bg-muted" />
                     </div>

                     {isPlLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                     ) : (pl.totalIncome || 0) > 0 ? (
                        <div className="space-y-2">
                           <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10 border">
                              <span className="text-xs text-muted-foreground">Invoices</span>
                              <span className="text-sm font-bold">{formatCurrency(pl.invoiceIncome || 0)}</span>
                           </div>
                           <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10 border">
                              <span className="text-xs text-muted-foreground">POS Sales</span>
                              <span className="text-sm font-bold">{formatCurrency(pl.posIncome || 0)}</span>
                           </div>
                        </div>
                     ) : (
                        <div className="py-4 text-center border border-dashed rounded-xl opacity-50">
                           <p className="text-[10px] font-medium">No income data</p>
                        </div>
                     )}
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Quick Access</h3>
                        <div className="h-px flex-1 mx-4 bg-muted" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <a href="/expenses" className="p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-center group">
                           <Receipt size={18} className="mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                           <p className="text-[10px] font-black uppercase">Expenses</p>
                        </a>
                        <a href="/vat-report" className="p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-center group">
                           <FileCheck2 size={18} className="mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                           <p className="text-[10px] font-black uppercase">VAT Report</p>
                        </a>
                        <a href="/cashbook" className="p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-center group">
                           <Landmark size={18} className="mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                           <p className="text-[10px] font-black uppercase">Cash Book</p>
                        </a>
                        <a href="/khata" className="p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-center group">
                           <Calculator size={18} className="mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                           <p className="text-[10px] font-black uppercase">Khata</p>
                        </a>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Outstanding Receivables */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="h-fit">
              <CardHeader className="pb-4 border-b bg-muted/5">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <BarChart3 className="h-4 w-4 text-primary" />
                       <CardTitle className="text-lg">Receivables</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5">Aging Report</Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                 {isOutstandingLoading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                 ) : outstandingList.length > 0 ? (
                    outstandingList.slice(0, 6).map((item: any) => (
                       <div key={item.customerId} className="p-4 rounded-xl border hover:border-primary/30 transition-all cursor-pointer group">
                           <div className="flex justify-between items-start mb-3">
                             <div className="min-w-0 pr-2">
                                <p className="text-[11px] font-medium text-muted-foreground mb-0.5">Customer</p>
                                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{item.customerName}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[11px] font-medium text-rose-600 mb-0.5">Balance</p>
                                <p className="text-sm font-bold text-rose-600">{formatCurrency(item.totalOutstanding)}</p>
                             </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 text-[11px] font-medium">
                             <div className="flex items-center gap-1.5 opacity-60">
                                <FileText size={10} /> {item.invoiceCount} invoices
                             </div>
                             <div className="flex items-center gap-1.5 text-rose-500">
                                <Clock size={10} /> {item.invoices[0]?.daysOverdue || 0} days overdue
                             </div>
                          </div>

                          <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
                             <div 
                              className="h-full bg-rose-500 rounded-full" 
                              style={{ width: `${Math.min(100, (item.totalOutstanding / 50000) * 100)}%` }} 
                             />
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="py-20 text-center opacity-30 flex flex-col items-center">
                       <Briefcase size={40} className="mb-2" />
                       <p className="text-sm font-medium">All accounts settled</p>
                    </div>
                 )}
                 
                 <Button className="w-full mt-4 h-11 font-medium text-sm" variant="outline">
                    View All Receivables <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
              </CardContent>
           </Card>
        </div>
      </div>

    </div>
  );
};
