import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { khataApi } from '../api/api';
import api from '../api/axiosInstance';
import { 
  Users, 
  Search, 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ChevronLeft,
  FileText,
  Loader2,
  Trash2,
  Printer,
  Copy,
  Calendar,
  Phone,
  MessageCircle,
  Info
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { adToBS } from '../utils/nepali';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from '../components/ui/tabs';
import { cn } from '../components/ui/utils';
import { NumberInput } from '../components/ui/number-input';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '../components/ui/select';

const partySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['Customer', 'Supplier']),
  phone: z.string().optional(),
  openingBalance: z.number(),
});

const entrySchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
   type: z.number(), // 1 for Debit (receivable increase), 0 for Credit (receivable decrease)
  transactionType: z.string().min(1, 'Transaction type is required'),
  paymentMode: z.string().default('Cash'),
  referenceNumber: z.string().optional(),
  note: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

type PartyFormValues = z.infer<typeof partySchema>;
type EntryFormValues = z.infer<typeof entrySchema>;

export const Khata = () => {
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const businessName = 'Our Store';

  const queryClient = useQueryClient();

  const { data: parties = [], isLoading: isPartiesLoading, refetch: refetchParties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const res = await api.get('/khata/parties')
      console.log('[Khata] Parties response:', res.data)
      const data = res.data?.data ?? res.data ?? []
      if (data.length > 0) console.log('[Khata] First party structure:', data[0])
      return Array.isArray(data) ? data : []
    },
    staleTime: 1000 * 60, // 1 minute cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const { data: entriesRaw = [], isLoading: isLedgerLoading, refetch: refetchEntries } = useQuery({
    queryKey: ['khata-entries', selectedParty?.id],
    queryFn: async () => {
      if (!selectedParty?.id) return []
      console.log('[Khata] Fetching entries for:', selectedParty.id)
      const res = await api.get('/khata/entries', {
        params: { partyId: selectedParty.id }
      })
      console.log('[Khata] Entries response:', res.data)
      const data = res.data?.data ?? res.data ?? []
      return Array.isArray(data) ? data : []
    },
    enabled: !!selectedParty?.id,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const formatBS = (dateStr: string) => {
    try { return adToBS(new Date(dateStr)); } 
    catch(e) { return 'N/A'; }
  };

  const formatAD = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-NP', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

   function isDebitEntry(entryType: unknown) {
      return entryType === 1 || entryType === 'Debit';
   }

   function isCreditEntry(entryType: unknown) {
      return entryType === 0 || entryType === 'Credit';
   }

  // Preparation of data for the current view
  
  const processedEntries = useMemo(() => {
    if (!entriesRaw || entriesRaw.length === 0) return [];
    
    // Sort oldest first for balance calculation
    const sorted = [...entriesRaw].sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    // Calculate running balance
    let running = 0;
    const withBalance = sorted.map((entry: any) => {
      const type = entry.type ?? entry.Type;
      const amount = Number(entry.amount ?? 0);
         if (isDebitEntry(type)) running += amount;
         else running -= amount;
      return { ...entry, runningBalance: running };
    });
    
    // Return newest first for display
    return [...withBalance].sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [entriesRaw]);

  // Handle searching/filtering separately for display if needed
  const filtered = useMemo(() => {
    return processedEntries.filter((entry: any) => {
      if (!transactionSearch) return true;
      const search = transactionSearch.toLowerCase();
      return entry.transactionType.toLowerCase().includes(search) || 
             (entry.note && entry.note.toLowerCase().includes(search)) ||
             (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(search));
    });
  }, [processedEntries, transactionSearch]);

  const formatDate = formatAD;

  // Totals
   const totalDebit = processedEntries.reduce((sum, e) => sum + (isDebitEntry(e.type ?? e.Type) ? e.amount : 0), 0);
   const totalCredit = processedEntries.reduce((sum, e) => sum + (isCreditEntry(e.type ?? e.Type) ? e.amount : 0), 0);
   const netBalance = totalDebit - totalCredit;

  // Summary info
  const lastTransactionDate = processedEntries.length > 0 ? processedEntries[0].date : null;
  const totalTransactionsCount = processedEntries.length;
  const daysSinceLastPaymentValue = lastTransactionDate 
    ? Math.floor((new Date().getTime() - new Date(lastTransactionDate).getTime()) / (1000 * 3600 * 24))
    : 0;


  const filteredParties = parties.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.phone && p.phone.includes(searchTerm))
  );

  const partyForm = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: { type: 'Customer', openingBalance: 0 }
  });

  const entryForm = useForm<any>({
    resolver: zodResolver(entrySchema),
    defaultValues: { 
         type: 1,
         transactionType: 'Credit Sale',
      paymentMode: 'Cash',
      referenceNumber: '',
      date: new Date().toISOString().split('T')[0] 
    }
  });

  const { control, handleSubmit, watch } = entryForm;

  const onAddParty = async (values: PartyFormValues) => {
    try {
      setIsSubmitting(true);
      const payload = { ...values, type: values.type === 'Customer' ? 0 : 1 };
      await khataApi.createParty(payload);
      toast.success('Party added successfully');
      setIsAddPartyOpen(false);
      partyForm.reset();
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add party');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAddEntry = async (values: EntryFormValues) => {
    if (!selectedParty) return;
    try {
      setIsSubmitting(true);
      await khataApi.createEntry({ ...values, partyId: selectedParty.id });
      
         const isDebit = values.type === 1;
      toast.success(
            `Entry saved! NPR ${values.amount} ${isDebit ? 'added to receivable' : 'settled from receivable'} recorded.`
      );
      
      setIsAddEntryOpen(false);
      entryForm.reset({
            type: 1,
            transactionType: 'Credit Sale',
        paymentMode: 'Cash',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0]
      });
      await refetchEntries();
      await refetchParties();
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['khata-entries'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReminderMessage = () => {
    if (!selectedParty) return '';
    const absBalance = Math.abs(netBalance).toLocaleString('en-IN', {
      minimumFractionDigits: 2
    });

    if (netBalance > 0) {
      return `Dear ${selectedParty.name}, your outstanding balance with ${businessName} is NPR ${absBalance}. Kindly clear your dues at the earliest. Thank you. - ${businessName}`;
    } else if (netBalance < 0) {
      return `Dear ${selectedParty.name}, we acknowledge our outstanding payment of NPR ${absBalance} to you. We will clear it soon. Thank you. - ${businessName}`;
    } else {
      return `Dear ${selectedParty.name}, your account with ${businessName} is fully settled. Thank you!`;
    }
  };

  const currentReminderMessage = customMessage || getReminderMessage();

  const handleDeleteParty = async (partyId: string, partyName: string) => {
    if (!confirm(`Delete "${partyName}"? This will also delete all transactions.`)) return;
    try {
      await khataApi.deleteParty(partyId);
      toast.success('Party deleted');
      if (selectedParty?.id === partyId) setSelectedParty(null);
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete party');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar - Parties List */}
      <Card className={cn("lg:w-[380px] shrink-0 overflow-hidden flex flex-col no-print", selectedParty && "hidden lg:flex")}>
         <CardHeader className="p-4 bg-muted/20 border-b space-y-4">
            <div className="flex items-center justify-between">
               <CardTitle className="text-lg font-bold">Parties</CardTitle>
               <Button size="icon" className="h-8 w-8" onClick={() => setIsAddPartyOpen(true)}>
                  <Plus size={18} />
               </Button>
            </div>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
               <Input 
                  className="pl-9 h-9" 
                  placeholder="Search parties..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </CardHeader>
         <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
            {isPartiesLoading ? (
               <div className="space-y-2 p-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse"/>
                 ))}
               </div>
            ) : parties.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                 <Users className="w-10 h-10 text-muted-foreground/30 mb-3"/>
                 <p className="text-sm font-medium text-muted-foreground">No parties yet</p>
                 <p className="text-xs text-muted-foreground/70 mt-1">Click + to add a customer or supplier</p>
               </div>
            ) : filteredParties.length === 0 ? (
               <div className="p-10 text-center text-muted-foreground opacity-50 flex flex-col items-center">
                  <Users size={40} className="mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">No parties found.</p>
               </div>
            ) : (
                filteredParties.map((party: any) => (
                  <div
                     key={party.id}
                     onClick={() => setSelectedParty(party)}
                     className={cn(
                        "w-full p-4 border-b text-left transition-all flex items-center justify-between group cursor-pointer",
                        selectedParty?.id === party.id ? "bg-primary/5 border-primary/20 shadow-sm" : "hover:bg-muted/30"
                     )}
                  >
                     <div className="min-w-0 pr-4">
                        <p className={cn("font-bold truncate text-sm transition-colors", selectedParty?.id === party.id ? "text-primary" : "text-foreground")}>{party.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{party.phone || 'No phone'}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="text-right shrink-0">
                           <p className={cn("font-bold text-sm", 
                             (party.currentBalance ?? party.netBalance ?? 0) > 0 ? "text-emerald-600" : 
                             (party.currentBalance ?? party.netBalance ?? 0) < 0 ? "text-rose-600" : "text-muted-foreground")}>
                              {formatCurrency(Math.abs(party.currentBalance ?? party.netBalance ?? 0))}
                           </p>
                           <p className="text-[10px] font-semibold text-muted-foreground/70">
                                {(party.currentBalance ?? party.netBalance ?? 0) > 0 ? 'Receivable' : 
                                 (party.currentBalance ?? party.netBalance ?? 0) < 0 ? 'Payable' : 'Settled'}
                           </p>
                        </div>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteParty(party.id, party.name);
                           }}
                        >
                           <Trash2 size={14} />
                        </Button>
                     </div>
                  </div>
                ))
            )}
         </CardContent>
      </Card>

      {/* Main Content - Ledger */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all", !selectedParty && "hidden lg:flex")}>
         {selectedParty ? (
            <div className="flex flex-col h-full space-y-6">
               <Card className="shrink-0 bg-muted/10 border-none shadow-none no-print">
                  <CardContent className="p-6">
                     <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex items-center gap-4">
                           <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedParty(null)}>
                              <ChevronLeft size={20} />
                           </Button>
                           <Avatar className="h-14 w-14 border-2 border-primary/10">
                              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                                 {selectedParty.name.charAt(0)}
                              </AvatarFallback>
                           </Avatar>
                           <div className="flex items-center gap-3">
                              <h2 className="text-xl font-bold">{selectedParty.name}</h2>
                              <div className="flex items-center gap-2 mt-1">
                                 <Badge variant="outline" className="text-xs">
                                    {selectedParty.type === 0 ? 'Customer' : 'Supplier'}
                                 </Badge>
                                 {selectedParty.phone && (
                                    <span className="text-sm text-muted-foreground">{selectedParty.phone}</span>
                                 )}
                                 <span className="text-xs text-muted-foreground">{processedEntries.length} transactions</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {netBalance !== 0 && (
                              <Button variant="outline" size="sm" onClick={() => {
                                 setCustomMessage(getReminderMessage());
                                 setShowReminder(true);
                              }}>
                                 <MessageCircle className="mr-2 h-4 w-4" /> Reminder
                              </Button>
                           )}
                           <Button variant="outline" size="sm" onClick={() => window.print()}>
                              <Printer className="mr-2 h-4 w-4" /> Print
                           </Button>
                           <Button size="sm" onClick={() => setIsAddEntryOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" /> New Entry
                           </Button>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                           <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                              <ArrowUpCircle size={14} /> We Collect
                           </p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                               {formatCurrency(totalDebit)}
                            </p>
                         </div>
                         <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20">
                            <p className="text-xs text-rose-700 dark:text-rose-400 font-bold mb-2 flex items-center gap-1.5">
                               <ArrowDownCircle size={14} /> We Owe
                            </p>
                            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                               {formatCurrency(totalCredit)}
                            </p>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="p-3 rounded-lg bg-muted/30 border">
                           <p className="text-[10px] text-muted-foreground font-bold mb-1">Last Transaction</p>
                           <p className="text-sm font-bold">{lastTransactionDate ? formatDate(lastTransactionDate) : 'N/A'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border">
                           <p className="text-[10px] text-muted-foreground font-bold mb-1">Total Transactions</p>
                           <p className="text-sm font-bold">{totalTransactionsCount}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border">
                           <p className="text-[10px] text-muted-foreground font-bold mb-1">Inactivity</p>
                           <p className="text-sm font-bold">{daysSinceLastPaymentValue} days</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <div className="flex-1 flex flex-col overflow-hidden khata-print min-h-0">
                  {/* Transaction History Header */}
                  <div className="flex items-center justify-between mb-4 no-print px-4">
                    <h3 className="text-base font-semibold">Transaction History</h3>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-semibold px-3 py-1 rounded-full",
                        netBalance > 0 ? "bg-green-50 text-green-700" : 
                        netBalance < 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600"
                      )}>
                        Net: NPR {Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} 
                        {netBalance > 0 ? ' (Receivable)' : netBalance < 0 ? ' (Payable)' : ' (Settled)'}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-1"/> Print
                      </Button>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 no-print px-4">
                     <div className="flex items-center gap-2">
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                          <Input
                            type="date"
                            className="rounded-md h-8 text-sm w-36 pl-8"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                          />
                        </div>
                        <span className="text-muted-foreground text-sm">to</span>
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                          <Input
                            type="date"
                            className="rounded-md h-8 text-sm w-36 pl-8"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                          />
                        </div>
                        {(dateFrom || dateTo) && (
                          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                            Clear
                          </Button>
                        )}
                     </div>
                     <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <Input 
                           className="h-8 pl-8 placeholder:text-[11px]" 
                           placeholder="Search transactions..." 
                           value={transactionSearch}
                           onChange={(e) => setTransactionSearch(e.target.value)}
                        />
                     </div>
                  </div>

                  {/* Print Layout Info */}
                  <div className="hidden print:block p-8 text-center border-b-2 border-black mb-6">
                     <h1 className="text-2xl font-bold uppercase mb-1">Party Ledger Statement</h1>
                     <h2 className="text-xl font-medium mb-4">{selectedParty.name}</h2>
                     <div className="flex justify-between text-sm">
                        <p><strong>Phone:</strong> {selectedParty.phone || 'N/A'}</p>
                        <p><strong>Period:</strong> {dateFrom || 'Start'} to {dateTo || 'Today'}</p>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar px-4 print:overflow-visible print:px-0">
                    <div className="rounded-lg border border-border overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-0 bg-muted/50 border-b border-border">
                        <div className="col-span-3 px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Date</div>
                        <div className="col-span-4 px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Details</div>
                        <div className="col-span-2 px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide text-right">Debit</div>
                        <div className="col-span-2 px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide text-right">Credit</div>
                        <div className="col-span-1 px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide text-right">Balance</div>
                      </div>

                      {/* Table Body */}
                      {isLedgerLoading ? (
                        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div>
                      ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-background">
                          <FileText className="w-10 h-10 text-muted-foreground/30 mb-3"/>
                          <p className="text-sm font-medium text-muted-foreground">No transactions recorded</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">Click "+ New Entry" to add a transaction</p>
                        </div>
                      ) : (
                        filtered.map((entry: any, index: number) => (
                          <div key={entry.id} className={cn(
                            "grid grid-cols-12 gap-0 border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                            index % 2 === 0 ? "bg-background" : "bg-muted/5"
                          )}>
                            <div className="col-span-3 px-4 py-3">
                              <p className="text-sm text-foreground">{formatDate(entry.date)}</p>
                              <p className="text-xs text-muted-foreground">{formatBS(entry.date)} BS</p>
                            </div>
                            <div className="col-span-4 px-4 py-3">
                              <p className="text-sm font-medium text-foreground">{entry.note || entry.transactionType || 'Transaction'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground font-bold">{entry.transactionType}</span>
                                {entry.paymentMode && entry.paymentMode !== 'Cash' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{entry.paymentMode}</span>
                                )}
                                {entry.referenceNumber && (
                                  <span className="text-[10px] text-muted-foreground">Ref: {entry.referenceNumber}</span>
                                )}
                              </div>
                            </div>
                            <div className="col-span-2 px-4 py-3 text-right">
                                             {isDebitEntry(entry.type ?? entry.Type) ? (
                                <p className="text-sm font-semibold text-red-600">NPR {entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                              ) : <p className="text-sm text-muted-foreground/40">—</p>}
                            </div>
                            <div className="col-span-2 px-4 py-3 text-right">
                                             {isCreditEntry(entry.type ?? entry.Type) ? (
                                <p className="text-sm font-semibold text-green-600">NPR {entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                              ) : <p className="text-sm text-muted-foreground/40">—</p>}
                            </div>
                            <div className="col-span-1 px-4 py-3 text-right">
                              <p className={cn(
                                "text-sm font-semibold",
                                entry.runningBalance > 0 ? "text-green-600" : entry.runningBalance < 0 ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {Math.abs(entry.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                                <span className="text-[10px] ml-0.5">{entry.runningBalance > 0 ? 'DR' : entry.runningBalance < 0 ? 'CR' : ''}</span>
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer totals */}
                    {filtered.length > 0 && (
                      <div className="flex items-center justify-end gap-8 mt-3 px-4 py-2 bg-muted/30 rounded-lg">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total Debit</p>
                          <p className="text-sm font-bold text-red-600">NPR {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total Credit</p>
                          <p className="text-sm font-bold text-green-600">NPR {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right border-l border-border pl-8">
                          <p className="text-xs text-muted-foreground">Net Balance</p>
                          <p className={cn(
                            "text-sm font-bold",
                            netBalance > 0 ? "text-green-600" : netBalance < 0 ? "text-red-600" : "text-muted-foreground"
                          )}>
                            {Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            {netBalance > 0 ? ' (Receivable)' : netBalance < 0 ? ' (Payable)' : ' (Settled)'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Print Signature Section */}
                    <div className="hidden print:block mt-12 pt-8 border-t border-black">
                      <div className="flex justify-between">
                         <div className="border-t border-black w-40 pt-2 text-center text-xs">Auth. Signature</div>
                         <div className="border-t border-black w-40 pt-2 text-center text-xs">Customer/Supplier Signature</div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
         ) : (
            <Card className="h-full flex flex-col items-center justify-center border-dashed border-2 bg-muted/5 no-print">
               <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6 text-muted-foreground opacity-50">
                  <Users size={32} />
               </div>
               <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Select a Party</h3>
                  <p className="text-muted-foreground text-sm max-w-[300px]">Choose a customer or supplier to view their ledger and add entries.</p>
               </div>
            </Card>
         )}
      </div>

      {/* Add Party Dialog */}
      <Dialog open={isAddPartyOpen} onOpenChange={setIsAddPartyOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Add New Party</DialogTitle>
            </DialogHeader>
            <form onSubmit={partyForm.handleSubmit(onAddParty)} className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input {...partyForm.register('name')} placeholder="Business or Individual Name" />
               </div>
               <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...partyForm.register('phone')} placeholder="+977" />
               </div>
               <div className="space-y-2">
                  <Label>Type</Label>
                  <Tabs value={partyForm.watch('type')} onValueChange={(v) => partyForm.setValue('type', v as any)}>
                     <TabsList className="w-full">
                        <TabsTrigger value="Customer" className="flex-1">Customer</TabsTrigger>
                        <TabsTrigger value="Supplier" className="flex-1">Supplier</TabsTrigger>
                     </TabsList>
                  </Tabs>
               </div>
               <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Opening Balance (Optional)</Label>
                  <NumberInput {...partyForm.register('openingBalance', { valueAsNumber: true })} />
               </div>
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddPartyOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Add Party
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
         <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
               <DialogTitle>Add Entry for {selectedParty?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddEntry)} className="space-y-5 py-4">
               <div className="grid grid-cols-2 gap-3">
                   <button
                      type="button"
                      onClick={() => {
                         entryForm.setValue('type', 1);
                         entryForm.setValue('transactionType', 'Credit Sale');
                      }}
                      className={cn(
                         "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                         watch('type') === 1 ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20" : "hover:bg-muted"
                      )}
                   >
                      <ArrowUpCircle size={20} />
                      <span className="text-[10px] font-bold">Debit (We Collect)</span>
                   </button>
                   <button
                      type="button"
                      onClick={() => {
                         entryForm.setValue('type', 0);
                         entryForm.setValue('transactionType', 'Payment Received');
                      }}
                      className={cn(
                         "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                         watch('type') === 0 ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20" : "hover:bg-muted"
                      )}
                   >
                      <ArrowDownCircle size={20} />
                      <span className="text-[10px] font-bold uppercase">Credit (We Owe)</span>
                   </button>
               </div>
               <div className="space-y-2">
                  <Label>Amount (NPR) *</Label>
                  <NumberInput step="0.01" className="text-2xl font-bold h-14" {...entryForm.register('amount', { valueAsNumber: true })} />
               </div>
               <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" {...entryForm.register('date')} />
               </div>
               <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Controller
                     name="transactionType"
                     control={control}
                     render={({ field }) => (
                        <Select
                           onValueChange={field.onChange}
                           value={field.value}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                           </SelectTrigger>
                           <SelectContent>
                              {watch('type') === 0 ? (
                                 <>
                                    <SelectItem value="Cash Receipt">Cash Receipt</SelectItem>
                                    <SelectItem value="Payment Received">Payment Received</SelectItem>
                                    <SelectItem value="Supplier Return">Supplier Return</SelectItem>
                                    <SelectItem value="Liability Adjustment">Liability Adjustment</SelectItem>
                                 </>
                              ) : (
                                 <>
                                    <SelectItem value="Credit Sale">Credit Sale</SelectItem>
                                    <SelectItem value="Cash Payment">Cash Payment</SelectItem>
                                    <SelectItem value="Credit Purchase">Credit Purchase</SelectItem>
                                    <SelectItem value="Receivable Adjustment">Receivable Adjustment</SelectItem>
                                 </>
                              )}
                           </SelectContent>
                        </Select>
                     )}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Controller
                     name="paymentMode"
                     control={control}
                     render={({ field }) => (
                        <Select
                           onValueChange={field.onChange}
                           value={field.value}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder="Payment mode" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Cheque">Cheque</SelectItem>
                              <SelectItem value="eSewa">eSewa</SelectItem>
                              <SelectItem value="Khalti">Khalti</SelectItem>
                              <SelectItem value="ConnectIPS">ConnectIPS</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                           </SelectContent>
                        </Select>
                     )}
                  />
               </div>
               {watch('paymentMode') !== 'Credit' && watch('transactionType') !== 'Opening Balance' && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg text-[11px] text-blue-700 border border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/10">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-blue-700 dark:text-blue-400">
                      This payment will be automatically recorded in your Cash Book under 
                      the <strong className="font-bold underline uppercase">{watch('paymentMode')}</strong> account.
                    </span>
                  </div>
               )}
               <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input {...entryForm.register('referenceNumber')} placeholder="Cheque no., receipt no., etc." />
               </div>
               <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea {...entryForm.register('note')} rows={2} placeholder="Add a note (optional)..." />
               </div>
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddEntryOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Add Entry
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Payment Reminder Dialog */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
         <DialogContent className="sm:max-w-[440px]" aria-describedby={undefined}>
            <DialogHeader>
               <DialogTitle>Send Payment Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
               {/* Party info */}
               <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                     {selectedParty?.name?.charAt(0)}
                  </div>
                  <div>
                     <p className="font-medium text-sm">{selectedParty?.name}</p>
                     <p className={cn(
                        "text-xs font-semibold",
                        netBalance > 0 ? "text-green-600" : "text-red-600"
                     )}>
                        {netBalance > 0 
                           ? `They owe you NPR ${Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                           : netBalance < 0
                           ? `You owe them NPR ${Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                           : 'Account settled'
                        }
                     </p>
                  </div>
               </div>
               {/* Message preview */}
               <div className="space-y-2">
                  <Label className="text-sm">Message Preview</Label>
                  <Textarea
                     value={currentReminderMessage}
                     onChange={(e) => setCustomMessage(e.target.value)}
                     rows={4}
                     className="rounded-md text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">You can edit the message before sending</p>
               </div>
               {/* Phone number */}
               {selectedParty?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <Phone className="w-4 h-4"/>
                     <span>{selectedParty.phone}</span>
                  </div>
               )}
            </div>
            <DialogFooter className="gap-2">
               <Button
                  variant="outline"
                  onClick={() => {
                     navigator.clipboard.writeText(currentReminderMessage);
                     toast.success('Message copied!');
                  }}
               >
                  <Copy className="w-4 h-4 mr-2"/>
                  Copy Text
               </Button>
               <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!selectedParty?.phone}
                  onClick={() => {
                     const phone = selectedParty.phone.replace(/\D/g, '');
                     const url = `https://wa.me/${phone}?text=${encodeURIComponent(currentReminderMessage)}`;
                     window.open(url, '_blank');
                  }}
               >
                  <MessageCircle className="w-4 h-4 mr-2"/>
                  Send via WhatsApp
               </Button>
            </DialogFooter>
            {!selectedParty?.phone && (
               <p className="text-xs text-amber-600 text-center -mt-2">
                  Add a phone number to this party to enable WhatsApp
               </p>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
};
