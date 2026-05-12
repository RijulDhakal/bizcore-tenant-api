import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { 
  Users, 
  Truck, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Percent 
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useState } from 'react';
import { AddPartnerModal } from '../components/partners/AddPartnerModal';

export default function Partners() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'merchants' | 'delivery'>('merchants');
  const [search, setSearch] = useState('');

  const { data: merchants = [], isLoading: isMerchantsLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const res = await api.get('/merchants');
      return res.data?.data || res.data || [];
    },
    enabled: activeTab === 'merchants',
  });

  const { data: deliveryPartners = [], isLoading: isDeliveryLoading } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: async () => {
      const res = await api.get('/delivery-partners');
      return res.data?.data || res.data || [];
    },
    enabled: activeTab === 'delivery',
  });

  const currentData = activeTab === 'merchants' ? merchants : deliveryPartners;
  const safeData = Array.isArray(currentData) ? currentData : [];
  
  const filtered = safeData.filter((p: any) => 
    (p?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partners</h1>
          <p className="text-sm text-muted-foreground">Manage your merchants and delivery network</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      </div>

      <AddPartnerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        defaultTab={activeTab} 
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          <button
            onClick={() => setActiveTab('merchants')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'merchants' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none' 
                : 'bg-card dark:bg-slate-900 border dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-tight">Merchants</span>
          </button>
          
          <button
            onClick={() => setActiveTab('delivery')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'delivery' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none' 
                : 'bg-card dark:bg-slate-900 border dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
            }`}
          >
            <Truck className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-tight">Delivery</span>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-slate-500" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card dark:bg-slate-900 border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((p: any) => (
              <Card key={p.id} className="p-5 border-none shadow-md dark:shadow-none bg-white dark:bg-slate-900 backdrop-blur-sm group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all dark:border dark:border-slate-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                      {activeTab === 'merchants' ? <Users /> : <Truck />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{p.name}</h3>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest mt-1 dark:border-slate-700 dark:text-slate-400">
                        {activeTab === 'merchants' ? 'Merchant' : p.type}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={p.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                    <Phone className="h-3.5 w-3.5" />
                    {p.phone || p.contactPhone}
                  </div>
                  {activeTab === 'merchants' ? (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                      <Percent className="h-3.5 w-3.5" />
                      {p.defaultCommissionRate}% Comm.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                      <Truck className="h-3.5 w-3.5" />
                      NPR {p.defaultDeliveryFee} fee
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium col-span-2">
                      <Mail className="h-3.5 w-3.5" />
                      {p.email}
                    </div>
                  )}
                  {p.address && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium col-span-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.address}
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {(isMerchantsLoading || isDeliveryLoading) && (
              <div className="col-span-2 py-12 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                Synchronizing partners...
              </div>
            )}

            {!isMerchantsLoading && !isDeliveryLoading && filtered.length === 0 && (
              <div className="col-span-2 py-12 text-center text-muted-foreground italic text-sm">
                No partners found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
