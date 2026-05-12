import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Landmark,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Settings,
  Building,
  History,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { bankingApi } from '../api/api';
import api from '../api/axiosInstance';
import { formatCurrency } from '../utils/format';
import { adToBS } from '../utils/nepali';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function CashBook() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // Dialog states
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false);
  
  const [accountFormData, setAccountFormData] = useState({
    accountName: "",
    accountType: "Cash",
    bankName: "",
    accountNumber: "",
    branchName: "",
    openingBalance: "0",
    isDefault: false
  });

  const [txFormData, setTxFormData] = useState({
    accountId: "",
    type: "Deposit",
    amount: "",
    transactionDate: new Date().toISOString().split('T')[0],
    description: "",
    payee: "",
    reference: "",
    category: "Other"
  });

  const queryClient = useQueryClient();

  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await api.get('/banking/accounts');
      const data = res.data?.data ?? res.data ?? [];
      const arr = Array.isArray(data) ? data : [];
      // Deduplicate by id
      const deduplicated = arr.filter((a: any, i: number, self: any[]) => 
        i === self.findIndex((b: any) => b.id === a.id)
      );
      if (deduplicated.length > 0 && !selectedAccountId) {
        setSelectedAccountId(deduplicated[0].id);
      }
      return deduplicated;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
  });

  const accounts = accountsData || [];

  const { data: transactions = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['bank-transactions', selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return []
      const res = await api.get('/banking/transactions?accountId=' + selectedAccountId)
      const data = res.data?.data ?? res.data ?? []
      return Array.isArray(data) ? data : []
    },
    enabled: !!selectedAccountId,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: true,
  });

  const cashBookData = {
    transactions,
    totalDeposits: transactions.filter((t: any) => t.type === 'Deposit').reduce((s: number, t: any) => s + t.amount, 0),
    totalWithdrawals: transactions.filter((t: any) => t.type === 'Withdrawal').reduce((s: number, t: any) => s + t.amount, 0),
  };
  const loading = accountsLoading || ledgerLoading;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bankingApi.createAccount({
        ...accountFormData,
        openingBalance: parseFloat(accountFormData.openingBalance)
      });
      toast.success("Account created successfully");
      setIsAccountDialogOpen(false);
      resetAccountForm();
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    } catch (error) {
      toast.error("Failed to create account");
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bankingApi.createTransaction({
        ...txFormData,
        amount: parseFloat(txFormData.amount)
      });
      toast.success("Transaction recorded");
      setIsTxDialogOpen(false);
      resetTxForm();
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Transaction failed");
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (!confirm("Delete this transaction? Initial balance will be reversed.")) return;
    try {
      await bankingApi.deleteTransaction(id);
      toast.success("Transaction deleted");
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const resetAccountForm = () => {
    setAccountFormData({
      accountName: "",
      accountType: "Cash",
      bankName: "",
      accountNumber: "",
      branchName: "",
      openingBalance: "0",
      isDefault: false
    });
  };

  const resetTxForm = () => {
    setTxFormData({
      accountId: selectedAccountId || "",
      type: "Deposit",
      amount: "",
      transactionDate: new Date().toISOString().split('T')[0],
      description: "",
      payee: "",
      reference: "",
      category: "Other"
    });
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Calculate inclusive running balance and sort newest first for display
  const transactionsWithBalance = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // 1. Sort oldest first for balance calculation
    const chronological = [...transactions].sort((a: any, b: any) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // 2. Calculate running balance from opening
    const openingBal = Number(selectedAccount?.openingBalance || 0);
    let running = openingBal;

    const withBalance = chronological.map((tx: any) => {
      const amount = Number(tx.amount || 0);
      const isOutflow = tx.type === "Withdrawal" || tx.type === "Payment" || tx.type === "Transfer Out" || tx.type === "Debit";
      
      if (isOutflow) running -= amount;
      else running += amount;

      return { ...tx, calculatedBalance: running };
    });

    // 3. Sort newest first for display
    return [...withBalance].sort((a: any, b: any) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [transactions, selectedAccount]);

  const cashBookTotals = useMemo(() => {
    const openingBalance = Number(selectedAccount?.openingBalance || 0);
    const totalDeposits = transactions.filter((t: any) => t.type === 'Deposit' || t.type === 'Receipt' || t.type === 'Credit')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const totalWithdrawals = transactions.filter((t: any) => t.type === 'Withdrawal' || t.type === 'Payment' || t.type === 'Debit')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    return {
      openingBalance,
      totalDeposits,
      totalWithdrawals,
      closingBalance: openingBalance + totalDeposits - totalWithdrawals
    };
  }, [transactions, selectedAccount]);

  if (loading && accounts.length > 0 && !transactions.length) return <div className="p-20 text-center font-black animate-pulse opacity-50 uppercase tracking-[0.3em]">Loading Cash Book...</div>;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Landmark className="w-8 h-8 text-primary" />
            Cash & Bank Book
          </h1>
          <p className="text-muted-foreground font-medium">Manage money in-flow and out-flow across accounts</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setIsAccountDialogOpen(true)} className="font-bold border-dashed border-primary text-primary hover:bg-primary/5">
              <Plus className="w-4 h-4 mr-2" /> New Account
           </Button>
           <Button onClick={() => setIsTxDialogOpen(true)} className="font-bold" disabled={!selectedAccountId}>
              <Plus className="w-5 h-5 mr-2" /> Add Transaction
           </Button>
        </div>
      </div>

      {/* Account Tabs */}
      {accounts.length > 0 ? (
        <Tabs value={selectedAccountId || ""} onValueChange={setSelectedAccountId} className="w-full">
          <TabsList className="bg-muted/30 p-1 rounded-xl h-14 w-full flex justify-start overflow-x-auto overflow-y-hidden gap-1 border border-muted-foreground/10 mb-6">
            {accounts.map(acc => (
              <TabsTrigger 
                key={acc.id} 
                value={acc.id}
                className={cn(
                  "px-6 h-full rounded-lg font-black uppercase text-[10px] tracking-widest transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border border-transparent"
                )}
              >
                {acc.accountType === 'Cash' ? '💵' : '🏦'} {acc.accountName}
                {acc.isDefault && <Badge className="ml-2 bg-amber-500/10 text-amber-600 border-none px-1 h-3 text-[7px]">DF</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : (
        <div className="p-12 text-center bg-muted/20 border-2 border-dashed rounded-3xl space-y-4">
           <Landmark className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
           <div className="space-y-1">
             <p className="font-black uppercase tracking-widest text-muted-foreground">No accounts configured</p>
             <p className="text-xs text-muted-foreground font-medium">Create your first cash or bank account to start tracking</p>
           </div>
           <Button onClick={() => setIsAccountDialogOpen(true)} variant="outline" className="font-bold">
             Setup First Account
           </Button>
        </div>
      )}

      {selectedAccount && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
           {/* Account Detail Card */}
           <Card className="lg:col-span-1 border-none shadow-md bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="p-6 space-y-6">
                 <div className="flex justify-between items-start">
                    <Badge className="bg-primary/20 text-primary border-none font-black uppercase text-[9px] tracking-widest">
                       {selectedAccount.accountType}
                    </Badge>
                    <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                 </div>
                 
                 <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight">{selectedAccount.accountName}</h2>
                    {selectedAccount.bankName && (
                       <p className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                          <Building className="w-3 h-3" /> {selectedAccount.bankName}
                       </p>
                    )}
                    {selectedAccount.accountNumber && (
                       <p className="text-[10px] font-medium text-muted-foreground opacity-70">
                          {selectedAccount.accountNumber.replace(/\d(?=\d{4})/g, "*")}
                       </p>
                    )}
                 </div>

                 <div className="pt-4 border-t border-muted">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Current Balance</p>
                    <div className={cn(
                       "text-3xl font-black tracking-tighter",
                       selectedAccount.currentBalance >= 0 ? "text-green-600" : "text-rose-600"
                    )}>
                       {formatCurrency(selectedAccount.currentBalance)}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1">
                       <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <ArrowUpCircle className="w-2.5 h-2.5 text-green-500" /> Deposits
                       </p>
                       <p className="font-bold text-sm tracking-tight">{formatCurrency(cashBookData?.totalDeposits || 0)}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <ArrowDownCircle className="w-2.5 h-2.5 text-rose-500" /> Outflow
                       </p>
                       <p className="font-bold text-sm tracking-tight">{formatCurrency(cashBookData?.totalWithdrawals || 0)}</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Cash Book History */}
           <Card className="lg:col-span-3 border-none shadow-md overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/10 flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Transaction History
                 </h3>
                 <div className="flex items-center gap-2">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                     <Input placeholder="Search logs..." className="pl-9 h-8 w-64 bg-background border-none shadow-sm text-xs font-medium" />
                   </div>
                 </div>
              </div>
              <div className="flex-1 overflow-auto">
                 <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                           <TableRow>
                              <TableHead className="w-[120px] font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                              <TableHead className="font-black uppercase text-[10px] tracking-widest">Description</TableHead>
                              <TableHead className="font-black uppercase text-[10px] tracking-widest">Payee/Info</TableHead>
                              <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Debit (-)</TableHead>
                              <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Credit (+)</TableHead>
                              <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Balance</TableHead>
                              <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Source</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                           </TableRow>
                        </TableHeader>
                    <TableBody>
                       {transactionsWithBalance.map((tx: any) => {
                          const isOutflow = tx.type === "Withdrawal" || tx.type === "Payment" || tx.type === "Transfer Out";
                          return (
                             <TableRow key={tx.id} className="group transition-colors hover:bg-muted/10 border-muted/50">
                                <TableCell>
                                   <div className="font-bold text-xs">{new Date(tx.transactionDate).toLocaleDateString()}</div>
                                   <div className="text-[9px] font-black uppercase tracking-tight text-muted-foreground">
                                      {adToBS(new Date(tx.transactionDate))} BS
                                   </div>
                                </TableCell>
                                <TableCell>
                                   <div className="font-black uppercase tracking-tight text-xs flex items-center gap-2">
                                      {tx.description}
                                      {isOutflow ? <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> : <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                                   </div>
                                   <div className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">{tx.category}</div>
                                </TableCell>
                                <TableCell>
                                   <div className="text-[10px] font-bold uppercase tracking-widest">{tx.payee || "Internal"}</div>
                                   {tx.reference && <div className="text-[9px] text-muted-foreground mt-0.5 opacity-70">Ref: {tx.reference}</div>}
                                </TableCell>
                                <TableCell className="text-right">
                                   <span className={isOutflow ? "font-black text-rose-600 text-xs tracking-tighter" : "text-muted-foreground/30 text-xs"}>
                                      {isOutflow ? formatCurrency(tx.amount) : "—"}
                                   </span>
                                </TableCell>
                                <TableCell className="text-right">
                                   <span className={!isOutflow ? "font-black text-green-600 text-xs tracking-tighter" : "text-muted-foreground/30 text-xs"}>
                                      {!isOutflow ? formatCurrency(tx.amount) : "—"}
                                   </span>
                                </TableCell>
                                <TableCell className="text-right">
                                   <span className={cn(
                                       "font-black text-xs tracking-tighter px-2 py-1 rounded bg-muted/30",
                                       tx.calculatedBalance >= 0 ? "text-[var(--text-primary)]" : "text-rose-600"
                                   )}>
                                      {formatCurrency(tx.calculatedBalance)}
                                   </span>
                                </TableCell>
                                 <TableCell className="text-center">
                                    {tx.linkedModule ? (
                                       <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 border-primary/20 bg-primary/5 text-primary">
                                          {tx.linkedModule === 'POS' && '🖥️ POS'}
                                          {tx.linkedModule === 'Invoice' && '📄 Invoice'}
                                          {tx.linkedModule === 'Khata' && '📒 Khata'}
                                          {tx.linkedModule === 'Expense' && '💸 Expense'}
                                       </Badge>
                                    ) : (
                                       <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 bg-muted/50 text-muted-foreground">
                                          ✋ Manual
                                       </Badge>
                                    )}
                                 </TableCell>
                                <TableCell className="text-right">
                                   <button 
                                      onClick={() => handleDeleteTx(tx.id)}
                                      className="p-2 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                </TableCell>
                             </TableRow>
                          );
                       })}
                       {!cashBookData?.transactions?.length && (
                          <TableRow>
                             <TableCell colSpan={8} className="text-center py-20">
                                <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                                <p className="mt-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground">No transactions recorded for this period</p>
                             </TableCell>
                          </TableRow>
                       )}
                    </TableBody>
                 </Table>
              </div>
              <div className="p-4 bg-muted/10 border-t flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                 <div className="flex gap-4">
                    <span>Opening: <span className="text-muted-foreground ml-1">{formatCurrency(cashBookTotals.openingBalance)}</span></span>
                    <span className="text-green-600">+ IN: {formatCurrency(cashBookTotals.totalDeposits)}</span>
                    <span className="text-rose-600">- OUT: {formatCurrency(cashBookTotals.totalWithdrawals)}</span>
                 </div>
                 <div className="text-sm">
                    Closing: <span className={cn("ml-2", cashBookTotals.closingBalance >= 0 ? "text-primary" : "text-rose-600")}>{formatCurrency(cashBookTotals.closingBalance)}</span>
                 </div>
              </div>
           </Card>
        </div>
      )}

      {/* Add Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
         <DialogContent className="sm:max-w-[480px] border-none shadow-2xl">
            <DialogHeader>
               <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                     <Building className="w-5 h-5 text-primary" />
                  </div>
                  New Account Configuration
               </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAccount} className="space-y-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Account Name (Required)</Label>
                     <Input 
                        placeholder="e.g. NIC Asia Current, Petty Cash" 
                        value={accountFormData.accountName} 
                        required
                        onChange={(e) => setAccountFormData({...accountFormData, accountName: e.target.value})}
                        className="bg-muted/10 border-none font-bold"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Account Type</Label>
                     <Select value={accountFormData.accountType} onValueChange={(v) => setAccountFormData({...accountFormData, accountType: v})}>
                        <SelectTrigger className="bg-muted/10 border-none font-bold">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="Cash">Cash / Petty Cash</SelectItem>
                           <SelectItem value="Bank">Bank Account</SelectItem>
                           <SelectItem value="Mobile Banking">Mobile Banking / Wallet</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Opening Balance</Label>
                     <Input 
                        placeholder="0.00" 
                        type="number"
                        value={accountFormData.openingBalance} 
                        onChange={(e) => setAccountFormData({...accountFormData, openingBalance: e.target.value})}
                        className="bg-muted/10 border-none font-bold"
                     />
                  </div>
                  {accountFormData.accountType === "Bank" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Bank Name</Label>
                        <Input 
                            placeholder="e.g. NIC Asia Bank" 
                            value={accountFormData.bankName} 
                            onChange={(e) => setAccountFormData({...accountFormData, bankName: e.target.value})}
                            className="bg-muted/10 border-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Account Number</Label>
                        <Input 
                            placeholder="Bank Acc No." 
                            value={accountFormData.accountNumber} 
                            onChange={(e) => setAccountFormData({...accountFormData, accountNumber: e.target.value})}
                            className="bg-muted/10 border-none font-bold"
                        />
                      </div>
                    </>
                  )}
               </div>
               <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsAccountDialogOpen(false)} className="font-bold uppercase text-[10px]">Cancel</Button>
                  <Button type="submit" className="font-black uppercase tracking-widest text-[10px] px-8">Save Account</Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isTxDialogOpen} onOpenChange={setIsTxDialogOpen}>
         <DialogContent className="sm:max-w-[480px] border-none shadow-2xl">
            <DialogHeader>
               <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                     <ArrowUpCircle className="w-5 h-5 text-primary" />
                  </div>
                  Record Transaction
               </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTransaction} className="space-y-4 py-4">
               <Tabs value={txFormData.type} onValueChange={(v) => setTxFormData({...txFormData, type: v})}>
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/20">
                     <TabsTrigger value="Deposit" className="font-bold text-[10px] uppercase">Deposit / IN</TabsTrigger>
                     <TabsTrigger value="Withdrawal" className="font-bold text-[10px] uppercase">Withdrawal / OUT</TabsTrigger>
                  </TabsList>
               </Tabs>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Amount (Required)</Label>
                     <Input 
                        placeholder="0.00" 
                        type="number"
                        required
                        value={txFormData.amount} 
                        onChange={(e) => setTxFormData({...txFormData, amount: e.target.value})}
                        className="bg-muted/10 border-none font-black text-lg h-12"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Date</Label>
                     <Input 
                        type="date"
                        value={txFormData.transactionDate} 
                        onChange={(e) => setTxFormData({...txFormData, transactionDate: e.target.value})}
                        className="bg-muted/10 border-none font-bold h-12"
                     />
                  </div>
                  <div className="col-span-2 space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Description (Required)</Label>
                     <Input 
                        placeholder="e.g. Sales Collection, Rent Payment" 
                        required
                        value={txFormData.description} 
                        onChange={(e) => setTxFormData({...txFormData, description: e.target.value})}
                        className="bg-muted/10 border-none font-bold"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Payee / Origin</Label>
                     <Input 
                        placeholder="Optional" 
                        value={txFormData.payee} 
                        onChange={(e) => setTxFormData({...txFormData, payee: e.target.value})}
                        className="bg-muted/10 border-none font-bold"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Reference #</Label>
                     <Input 
                        placeholder="Cheque/Ref" 
                        value={txFormData.reference} 
                        onChange={(e) => setTxFormData({...txFormData, reference: e.target.value})}
                        className="bg-muted/10 border-none font-bold"
                     />
                  </div>
                  <div className="col-span-2 space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">Category</Label>
                     <Select value={txFormData.category} onValueChange={(v) => setTxFormData({...txFormData, category: v})}>
                        <SelectTrigger className="bg-muted/10 border-none font-bold">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {["Sales", "Purchase", "Salary", "Rent", "Utilities", "Transfer", "Tax", "Loan", "Investment", "Other"].map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsTxDialogOpen(false)} className="font-bold uppercase text-[10px]">Close</Button>
                  <Button type="submit" className="font-black uppercase tracking-widest text-[10px] px-8">Confirm Entry</Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
    </div>
  );
}
