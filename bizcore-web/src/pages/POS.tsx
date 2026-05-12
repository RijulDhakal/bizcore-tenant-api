import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePOS } from '../hooks/usePOS';
import { Monitor, Play, TrendingUp, Clock, Tag, Power, Loader2, ChevronRight, Store } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInventory } from '../hooks/useInventory';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';

const sessionSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  openingCash: z.number().min(0, 'Min 0'),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export default function POS() {
  const navigate = useNavigate();
  const { currentSession, openSession } = usePOS();
  const { warehouses } = useInventory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: posData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['pos-stats'],
    queryFn: async () => {
      let totalSales = 0;
      let transactionCount = 0;
      let topProduct = null;
      let sessionLoaded = false;

      try {
        const sessionRes = await api.get('/pos/sessions/current');
        const sessionData = sessionRes.data?.data;
        if (sessionData) {
          totalSales = Number(sessionData.totalSales ?? sessionData.TotalSales ?? 0);
          transactionCount = Number(sessionData.totalTransactions ?? sessionData.TotalTransactions ?? 0);
          sessionLoaded = true;
        }
      } catch {}

      try {
        const today = new Date().toISOString().split('T')[0];
        const analyticsRes = await api.get(`/pos/analytics/daily?date=${today}`);
        const analytics = analyticsRes.data?.data;
        if (analytics) {
          if (!sessionLoaded) {
            totalSales = Number(analytics.totalSales ?? analytics.TotalSales ?? analytics.totalRevenue ?? analytics.TotalRevenue ?? 0);
            transactionCount = Number(analytics.transactionCount ?? analytics.TransactionCount ?? analytics.totalTransactions ?? analytics.TotalTransactions ?? 0);
          }
          topProduct = analytics.topSellingProduct || analytics.TopSellingProduct || analytics.topProduct || analytics.topProductName || analytics.TopProductName || null;
        }
      } catch {}

      return { totalSales, transactionCount, topProduct };
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  const totalSales = posData?.totalSales || 0;
  const transactionCount = posData?.transactionCount || 0;
  const topProduct = posData?.topProduct || null;

  const { data: warehousesData } = warehouses;
  const isSessionOpen = currentSession.data?.success;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { openingCash: 0 }
  });

  const onSubmit = async (values: SessionFormValues) => {
    try {
      setIsSubmitting(true);
      console.log('Submitting session:', values);
      const res = await openSession.mutateAsync({
        warehouseId: values.warehouseId,
        openingCash: Number(values.openingCash) || 0
      });
      console.log('Session opened:', res);
      setIsFormOpen(false);
      toast.success('Session opened successfully');
      navigate('/pos/terminal');
    } catch (e: any) {
      console.error('Session error:', e.response?.data);
      toast.error(e.response?.data?.message || 'Failed to open session');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Point of Sale</h1>
          <p className="text-sm text-muted-foreground">Manage retail transactions and sales sessions.</p>
        </div>
        <Badge variant="outline" className="h-8 px-3 gap-2">
          <span className={`h-2 w-2 rounded-full ${isSessionOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {isSessionOpen ? 'Online' : 'Offline'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Action Card */}
          <div className="lg:col-span-7 bg-card border border-border rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-150 transition-transform duration-[2000ms]">
             <Store size={240} className="text-[#4F6EF7]" />
          </div>
          
          <div className="w-32 h-32 bg-[#4F6EF7]/5 rounded-[40px] flex items-center justify-center text-[#4F6EF7] group-hover:bg-[#4F6EF7] group-hover:text-white transition-all duration-700 group-hover:rotate-12 group-hover:scale-110 shadow-inner border border-[#4F6EF7]/10">
            <Monitor size={56} className="italic" />
          </div>
          
          <div className="space-y-3 relative z-10">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Sales Terminal</h2>
            <p className="text-[var(--text-secondary)] max-w-sm mx-auto text-sm font-medium leading-relaxed">Process payments, generate receipts, and track inventory sales in real-time.</p>
          </div>
          
          {isSessionOpen ? (
            <Button size="lg" onClick={() => navigate('/pos/terminal')} className="w-full">
              <Play fill="currentColor" size={20} className="mr-2" />
              Resume Session
            </Button>
          ) : (
             <Button size="lg" onClick={() => setIsFormOpen(true)} className="w-full">
              <Power size={20} className="mr-2" />
              Open Session
            </Button>
          )}
        </div>

        {/* Stats Area */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-center">
          <div className="bg-card border border-border p-6 rounded-lg flex items-center gap-6 shadow-sm">
            <div className="bg-amber-500/10 p-5 rounded-2xl text-amber-500 border border-amber-500/10 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
              <TrendingUp size={28} />
            </div>
            <div>
               <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                NPR {totalSales.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <ChevronRight size={20} className="ml-auto text-[var(--text-muted)] opacity-20" />
          </div>

          <div className="bg-card border border-border p-6 rounded-lg flex items-center gap-6 shadow-sm">
            <div className="bg-blue-500/10 p-5 rounded-2xl text-blue-500 border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
              <Clock size={28} />
            </div>
            <div>
               <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                {isLoadingStats ? '...' : transactionCount} {transactionCount === 1 ? 'Order' : 'Orders'}
              </p>
            </div>
             <ChevronRight size={20} className="ml-auto text-[var(--text-muted)] opacity-20" />
          </div>

           <div className="bg-card border border-border p-6 rounded-lg flex items-center gap-6 shadow-sm">
            <div className="bg-pink-500/10 p-5 rounded-2xl text-pink-500 border border-pink-500/10 group-hover:bg-pink-500 group-hover:text-white transition-all duration-500">
              <Tag size={28} />
            </div>
            <div>
               <p className="text-sm text-muted-foreground">Top Product</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 truncate max-w-[180px]">
                {isLoadingStats ? '...' : (topProduct || 'No sales yet')}
              </p>
            </div>
             <ChevronRight size={20} className="ml-auto text-[var(--text-muted)] opacity-20" />
          </div>
        </div>
      </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Open New Session</DialogTitle>
          </DialogHeader>
          
          {!warehousesData?.data || warehousesData.data.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                No warehouses found. Please create a warehouse in Inventory before opening a POS session.
              </p>
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  navigate('/inventory');
                }}
              >
                Go to Inventory
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <Select onValueChange={(val) => setValue('warehouseId', val)}>
                  <SelectTrigger className="rounded-md">
                    <SelectValue placeholder="Select warehouse"/>
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {warehousesData?.data?.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.warehouseId && <p className="text-xs text-destructive">{errors.warehouseId.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label>Opening Cash (NPR)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="rounded-md"
                  onWheel={(e) => e.currentTarget.blur()}
                  onFocus={(e) => {
                    if (e.target.value === '0') e.target.value = ''
                  }}
                  {...register('openingCash', { 
                    valueAsNumber: true,
                    onBlur: (e) => {
                      if (e.target.value === '') e.target.value = '0'
                    }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the initial cash amount in your drawer
                </p>
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setIsFormOpen(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                  Opening...</>
                ) : 'Open Session'}
              </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
