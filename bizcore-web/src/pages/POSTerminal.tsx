import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePOS } from '../hooks/usePOS';
import { posApi } from '../api/pos.api';
import api from '../api/axiosInstance';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowLeft, 
  LogOut,
  Package,
  Warehouse,
  History,
  Loader2,
  User,
  UserPlus,
  Printer,
  X
} from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { formatCurrency } from '../utils/format';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '../components/ui/dialog';

export default function POSTerminal() {
  const navigate = useNavigate();
  const { products, currentSession, createTransaction } = usePOS();
  const queryClient = useQueryClient();
  
  const loadFromStorage = (key: string, fallback: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };
  
  const [cart, setCart] = useState<any[]>(() => loadFromStorage('pos-cart', []));
  const [search, setSearch] = useState(() => loadFromStorage('pos-search', ''));
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'QR'>('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [actualClosingCash, setActualClosingCash] = useState('');
  
  // Customer selection states
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(() => loadFromStorage('pos-customer', null));
  const [customerSearch, setCustomerSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const productList = products.data?.data || [];
  const session = currentSession.data?.data;

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('pos-cart', JSON.stringify(cart));
    localStorage.setItem('pos-search', search);
  }, [cart, search]);
  
  // Persist customer to localStorage
  useEffect(() => {
    if (selectedCustomer) {
      localStorage.setItem('pos-customer', JSON.stringify(selectedCustomer));
    }
  }, [selectedCustomer]);

  useEffect(() => {
    console.log('showCustomerDialog changed:', showCustomerDialog);
  }, [showCustomerDialog]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    return productList.filter((p: any) => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
    );
  }, [productList, search]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc: number, item: any) => acc + (item.sellingPrice * item.quantity), 0);
    const tax = subtotal * 0.13; // 13% VAT
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  }, [cart, discount]);

  const { data: customersData = [] } = useQuery({
    queryKey: ['contacts', 'Customer'],
    queryFn: async () => {
      const res = await api.get('/contacts?type=Customer&search=');
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const customers = customersData;

  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const response = await api.get('/business/me');
      return response?.data?.data;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const businessName = business?.name ?? business?.businessName ?? 'BizCore';

  const { data: txnsResponse } = useQuery({
    queryKey: ['pos', 'session-transactions', session?.id],
    queryFn: () => posApi.getTransactions({ sessionId: session.id }),
    enabled: !!session && isCloseDialogOpen,
  });

  const sessionTxns = txnsResponse?.data || [];
  
  const salesByMethod = useMemo(() => {
    return {
      Cash: sessionTxns.filter((t: any) => t.paymentMethod === 0).reduce((acc: number, t: any) => acc + t.totalAmount, 0),
      Card: sessionTxns.filter((t: any) => t.paymentMethod === 1).reduce((acc: number, t: any) => acc + t.totalAmount, 0),
      QR: sessionTxns.filter((t: any) => t.paymentMethod === 2).reduce((acc: number, t: any) => acc + t.totalAmount, 0),
    };
  }, [sessionTxns]);

  // Handle Loading State
  if (currentSession.isLoading || products.isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 text-center z-[110]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing terminal...</p>
        </div>
      </div>
    );
  }

  // Handle Error State
  if (currentSession.isError) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 text-center z-[110]">
        <div className="bg-destructive/5 text-destructive p-8 rounded-3xl max-w-sm border border-destructive/10 space-y-4">
          <h2 className="text-xl font-bold">Terminal Error</h2>
          <p className="text-sm opacity-80">Failed to connect to the session. Please check your internet connection and try again.</p>
          <Button onClick={() => window.location.reload()} variant="destructive" className="w-full">
            Retry Connection
          </Button>
          <Button onClick={() => navigate('/pos')} variant="ghost" className="w-full">
            Back to POS
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 text-center z-[100]">
        <div className="bg-card border border-border p-12 rounded-3xl max-w-md shadow-2xl space-y-6">
          <div className="bg-destructive/10 text-destructive p-6 rounded-2xl w-fit mx-auto">
            <LogOut size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
            <p className="text-muted-foreground text-sm">No active session was found. You must open a session from the main POS page before entering the terminal.</p>
          </div>
          <Button type="button" onClick={() => navigate('/pos')} className="w-full h-12 text-base font-semibold">
            Return to POS Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const addToCart = (product: any) => {
    if (product.currentStock <= 0) {
      toast.error('Out of stock');
      return;
    }
    
    setCart((prev: any[]) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
           toast.error('Not enough stock available');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev: any[]) => prev.map((item: any) => {
      if (item.id === id) {
        const product = productList.find((p: any) => p.id === id);
        const newQty = Math.max(0, item.quantity + delta);
         if (product && newQty > product.currentStock) {
          toast.error('Not enough stock available');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item: any) => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart((prev: any[]) => prev.filter((item: any) => item.id !== id));
  };


  const filteredCustomers = customers.filter((c: any) => {
    const name = (c.name || ((c.firstName || '') + ' ' + (c.lastName || ''))).toLowerCase();
    const phone = c.phone || '';
    const searchValue = customerSearch.toLowerCase();
    return name.includes(searchValue) || phone.includes(searchValue);
  });

  const handleAddNewCustomer = async () => {
    if (!newName.trim()) return;
    setIsAddingCustomer(true);
    try {
      const payload = {
        name: newName.trim(),
        phone: newPhone || null,
        email: null,
        address: null,
        type: 0,
        notes: null
      };
      console.log('Creating contact payload:', payload);

      const response = await api.post('/contacts', payload);
      console.log('Contact created:', response.data);

      const created = response.data?.data;
      if (created) {
        queryClient.invalidateQueries({ queryKey: ['contacts', 'Customer'] });
        setSelectedCustomer({
          id: created.id,
          name: created.name || newName.trim(),
          phone: created.phone || newPhone || null,
        });
        setShowCustomerDialog(false);
        setNewName('');
        setNewPhone('');
        toast.success(`${newName} added as customer`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add customer');
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const handleCompleteSale = async () => {
    console.log('Complete sale clicked');
    console.log('Cart:', cart);
    console.log('Session:', session);
    console.log('Total:', totals.total);

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!session?.id) {
      toast.error('No active session');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleOpenCustomerDialog = () => {
    console.log('Customer Select clicked');
    console.log('Dialog state before open:', showCustomerDialog);
    setShowCustomerDialog(true);
  };


  const processSale = async () => {
    try {
      setIsProcessing(true);
      const methodMap: Record<string, number> = { 'Cash': 0, 'Card': 1, 'QR': 2 };
      const payload = {
        sessionId: session.id,
        customerId: selectedCustomer?.id || null,
        paymentMethod: methodMap[paymentMethod],
        items: cart.map((item: any) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          discountPercent: 0,
          amount: item.quantity * item.sellingPrice
        })),
        subTotal: totals.subtotal,
        discountAmount: discount,
        taxAmount: totals.tax,
        totalAmount: totals.total,
        amountPaid: paymentMethod === 'Cash' ? Number(amountReceived) : totals.total,
        change: paymentMethod === 'Cash' ? Math.max(0, (Number(amountReceived) || 0) - totals.total) : 0
      };

      const response = await createTransaction.mutateAsync(payload);

      const transactionData = response?.data;
      const amountPaid = paymentMethod === 'Cash' ? (Number(amountReceived) || totals.total) : totals.total;
      const changeAmount = paymentMethod === 'Cash' ? Math.max(0, (Number(amountReceived) || 0) - totals.total) : 0;

      setReceiptData({
        transactionNumber: transactionData?.transactionNumber,
        items: cart.map((item: any) => ({
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          amount: item.quantity * item.sellingPrice
        })),
        subTotal: totals.subtotal,
        taxAmount: totals.tax,
        totalAmount: totals.total,
        paymentMethod,
        amountPaid,
        change: changeAmount,
        customerName: selectedCustomer?.name || null,
        createdAt: new Date().toISOString(),
      });
      setIsConfirmOpen(false);
      setShowReceipt(true);

      setSelectedCustomer(null);
      setCustomerSearch('');
      setShowCustomerDialog(false);
      setNewName('');
      setNewPhone('');
      localStorage.removeItem('pos-cart');
      localStorage.removeItem('pos-customer');

      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });

      toast.success('Sale completed successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    setCart([]);
    localStorage.removeItem('pos-cart');
    localStorage.removeItem('pos-customer');
    setDiscount(0);
    setAmountReceived('');
    setPaymentMethod('Cash');
    setShowReceipt(false);
    setReceiptData(null);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setShowCustomerDialog(false);
    setNewName('');
    setNewPhone('');
  };

  const handlePrint = () => {
    window.print();
  };


  const handleCloseSession = async () => {
    try {
      setIsProcessing(true);
      await posApi.closeSession(session.id, { closingCash: Number(actualClosingCash) || 0 });
      toast.success('Session closed successfully');
      navigate('/pos');
    } catch (err) {
      toast.error('Failed to close session');
    } finally {
      setIsProcessing(false);
      setIsCloseDialogOpen(false);
    }
  };

  const change = Math.max(0, (Number(amountReceived) || 0) - totals.total);

  const expectedCash = (session?.openingCash || 0) + salesByMethod.Cash;
  const cashDiff = (Number(actualClosingCash) || 0) - expectedCash;

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col h-screen overflow-hidden">
      {/* Session Info Bar */}
      <div className="h-12 border-b border-border bg-muted/30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <History size={16} />
          <span>Session opened at {session.openedAt ? new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}</span>
          <span className="opacity-30">•</span>
          <Warehouse size={16} />
          <span>{session.warehouseName}</span>
          <span className="opacity-30">•</span>
          <span>Sales today: {formatCurrency(session.totalSales || 0)}</span>
        </div>
        <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setIsCloseDialogOpen(true)}>
          <LogOut size={16} className="mr-2" />
          Close Session
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Product Grid */}
        <div className="flex-1 flex flex-col h-full bg-background">
          <div className="p-4 border-b border-border space-y-4">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/pos')} className="rounded-full">
                <ArrowLeft size={20} />
              </Button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 bg-muted/50 border-none focus-visible:ring-1"
                  autoFocus
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={clsx(
                    "flex flex-col bg-card border border-border p-4 rounded-xl transition-all shadow-sm relative group active:scale-[0.98]",
                    p.currentStock <= 0 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'cursor-pointer hover:shadow-md hover:border-primary/30'
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-0.5 max-w-[70%]">
                      <h3 className="font-semibold text-sm leading-tight">{p.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{p.sku}</p>
                    </div>
                    <Badge 
                      variant={p.currentStock > 0 ? "secondary" : "destructive"}
                      className={clsx(
                        "text-[10px] px-2 py-0 h-5 font-medium",
                        p.currentStock > 0 ? "bg-emerald-500/10 text-emerald-600 border-none" : ""
                      )}
                    >
                      {p.currentStock > 0 ? `${p.currentStock} in stock` : 'Out of stock'}
                    </Badge>
                  </div>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <p className="text-base font-bold text-primary">{formatCurrency(p.sellingPrice)}</p>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center scale-0 group-hover:scale-100 transition-transform">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-24 flex flex-col items-center justify-center text-muted-foreground">
                  <Package size={48} className="opacity-20 mb-4" />
                  <p className="text-sm font-medium">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Cart */}
        <div className="w-[400px] flex flex-col h-full border-l border-border bg-card shadow-lg">
          <div className="p-6 border-b border-border flex items-center justify-between bg-card text-card-foreground">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Cart</h2>
              <Badge variant="secondary" className="h-5 px-1.5 font-bold">{cart.length}</Badge>
            </div>
            {cart.length > 0 && (
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                onClick={() => setCart([])}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="p-3 bg-muted/30 rounded-lg flex items-center gap-3 group">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.sellingPrice)}</p>
                </div>
                
                <div className="flex items-center gap-2 bg-background rounded-md border border-border p-1">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-sm"
                    onClick={() => updateQty(item.id, -1)}
                  >
                    <Minus size={12} />
                  </Button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-sm"
                    onClick={() => updateQty(item.id, 1)}
                  >
                    <Plus size={12} />
                  </Button>
                </div>

                <div className="text-right w-20">
                  <p className="text-sm font-bold">{formatCurrency(item.sellingPrice * item.quantity)}</p>
                </div>

                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground/30 text-center space-y-4">
                <ShoppingCart size={64} strokeWidth={1.5} />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Your cart is empty</p>
                  <p className="text-xs">Click products to add them</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border bg-card space-y-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (13%)</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-end">
                <span className="font-semibold text-base">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <Separator />

            {/* Customer Section */}
            <div className="border rounded-md p-3 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {selectedCustomer?.name || 'Walk-in Customer'}
                  </p>
                  {selectedCustomer?.phone && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCustomer.phone}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleOpenCustomerDialog}
              >
                {selectedCustomer ? 'Change' : 'Select'}
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  type="button"
                  variant={paymentMethod === 'Cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('Cash')}
                  className="h-14 flex flex-col gap-1 rounded-xl"
                >
                  <Banknote className="w-4 h-4"/>
                  <span className="text-[10px] font-medium uppercase tracking-wider">Cash</span>
                </Button>
                <Button 
                  type="button"
                  variant={paymentMethod === 'Card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('Card')}
                  className="h-14 flex flex-col gap-1 rounded-xl"
                >
                  <CreditCard className="w-4 h-4"/>
                  <span className="text-[10px] font-medium uppercase tracking-wider">Card</span>
                </Button>
                <Button 
                  type="button"
                  variant={paymentMethod === 'QR' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('QR')}
                  className="h-14 flex flex-col gap-1 rounded-xl"
                >
                  <QrCode className="w-4 h-4"/>
                  <span className="text-[10px] font-medium uppercase tracking-wider">QR</span>
                </Button>
              </div>

              {paymentMethod === 'Cash' && cart.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Amount Received</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="h-11 rounded-md bg-muted/50 border-none text-lg font-bold focus-visible:ring-1"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground font-medium">Change</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(change)}</span>
                  </div>
                </div>
              )}
            </div>

            <Button 
              type="button"
              className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20 rounded-2xl"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCompleteSale}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Complete Sale — {formatCurrency(totals.total)}
            </Button>
          </div>
        </div>
      </div>

      {/* Close Session Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="sm:max-w-[480px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Finalize Session Summary</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Transactions</p>
                   <p className="text-xl font-bold">{session.totalTransactions}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                   <p className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1">Total Revenue</p>
                   <p className="text-xl font-bold text-primary">{formatCurrency(session.totalSales)}</p>
                </div>
             </div>

             <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sales Breakdown</h4>
                <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm border border-border/50">
                   <div className="flex justify-between">
                      <span>Cash Sales</span>
                      <span className="font-semibold">{formatCurrency(salesByMethod.Cash)}</span>
                   </div>
                   <div className="flex justify-between text-muted-foreground">
                      <span>Card Sales</span>
                      <span>{formatCurrency(salesByMethod.Card)}</span>
                   </div>
                   <div className="flex justify-between text-muted-foreground">
                      <span>QR Sales</span>
                      <span>{formatCurrency(salesByMethod.QR)}</span>
                   </div>
                </div>
             </div>

             <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Opening Cash</span>
                   <span className="font-mono">{formatCurrency(session.openingCash)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                   <span>Expected Cash</span>
                   <span className="font-mono">{formatCurrency(expectedCash)}</span>
                </div>
                
                <div className="space-y-2 pt-2">
                   <Label className="text-sm font-bold">Actual Closing Cash</Label>
                   <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input 
                         type="number"
                         value={actualClosingCash}
                         onChange={(e) => setActualClosingCash(e.target.value)}
                         className="pl-10 h-12 text-lg font-bold bg-muted/20"
                         placeholder="Count your cash..."
                      />
                   </div>
                </div>

                <div className={clsx(
                   "flex justify-between items-center p-3 rounded-xl border",
                   cashDiff === 0 ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                   cashDiff > 0 ? "bg-blue-50 border-blue-100 text-blue-700" :
                   "bg-rose-50 border-rose-100 text-rose-700"
                )}>
                   <span className="text-sm font-medium">Difference (Over/Short)</span>
                   <span className="text-lg font-bold">{formatCurrency(cashDiff)}</span>
                </div>
             </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsCloseDialogOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" className="rounded-xl font-bold" onClick={handleCloseSession} disabled={isProcessing}>
               {isProcessing ? <Loader2 size={16} className="animate-spin mr-2" /> : <LogOut size={16} className="mr-2" />}
               Confirm & Close Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {cart.map((item: any) => (
                   <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name} <span className="text-[10px] font-bold">x{item.quantity}</span></span>
                      <span className="font-medium">{formatCurrency(item.sellingPrice * item.quantity)}</span>
                   </div>
                ))}
             </div>
             
             <Separator />
             
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Subtotal</span>
                   <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">VAT (13%)</span>
                   <span>{formatCurrency(totals.tax)}</span>
                </div>
                {discount > 0 && (
                   <div className="flex justify-between text-sm text-rose-500">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                   </div>
                )}
                <div className="flex justify-between items-end pt-2 border-t mt-2">
                   <span className="text-lg font-bold">Grand Total</span>
                   <span className="text-2xl font-black text-primary">{formatCurrency(totals.total)}</span>
                </div>
             </div>

             <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex justify-between items-center mb-3">
                   <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</span>
                   <Badge variant="outline" className="bg-background">{paymentMethod}</Badge>
                </div>
                
                {paymentMethod === 'Cash' && (
                   <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Amount Received</span>
                         <span className="font-bold">{formatCurrency(Number(amountReceived) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-emerald-600 pt-1 border-t border-dashed border-emerald-200">
                         <span>Change Due</span>
                         <span>{formatCurrency(change)}</span>
                      </div>
                   </div>
                )}
             </div>

             <div className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</span>
                   {selectedCustomer ? (
                      <div className="text-right">
                         <p className="text-sm font-bold">{selectedCustomer.name}</p>
                         <p className="text-[10px] text-muted-foreground">{selectedCustomer.phone}</p>
                      </div>
                   ) : (
                      <Badge variant="outline">Walk-in</Badge>
                   )}
                </div>
             </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button type="button" className="flex-1 rounded-xl font-bold h-12 shadow-lg shadow-primary/20" onClick={processSale} disabled={isProcessing}>
               {isProcessing ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
               Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-[420px]" aria-describedby="customer-dialog-description">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription id="customer-dialog-description">
              Search for an existing customer or add a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Search by name or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="rounded-md"
              autoFocus
            />

            {filteredCustomers.length > 0 && (
              <div className="max-h-[180px] overflow-y-auto border rounded-md divide-y">
                {filteredCustomers.map((c: any) => (
                  <button
                    type="button"
                    key={c.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left transition-colors"
                    onClick={() => {
                      const contactName = (c.name || ((c.firstName || '') + ' ' + (c.lastName || ''))).trim();
                      setSelectedCustomer({
                        id: c.id,
                        name: contactName,
                        phone: c.phone || null
                      });
                      setShowCustomerDialog(false);
                      setCustomerSearch('');
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {(c.name?.charAt(0) || c.firstName?.charAt(0) || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.phone || 'No phone number'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {filteredCustomers.length === 0 && customerSearch.length > 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No customers found for "{customerSearch}"
              </p>
            )}

            <Separator />

            <div className="space-y-2">
              <Label>Add New Customer</Label>
              <Input
                placeholder="Full name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-md"
              />
              <Input
                placeholder="Phone number (optional)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="rounded-md"
              />
              <Button
                type="button"
                className="w-full"
                onClick={handleAddNewCustomer}
                disabled={!newName.trim() || isAddingCustomer}
              >
                {isAddingCustomer ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add & Select Customer
                  </>
                )}
              </Button>
            </div>

            <Separator />

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedCustomer(null);
                setShowCustomerDialog(false);
                setCustomerSearch('');
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Continue as Walk-in Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Final Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[380px] p-0" aria-describedby={undefined}>
          <div className="pos-receipt-print p-4 bg-white">
            <div className="text-center mb-3">
              <p className="font-bold text-lg">{businessName || 'BizCore'}</p>
              <p className="text-xs text-gray-500">ERP + Digital Khata</p>
              <p className="text-xs text-gray-500">{new Date(receiptData?.createdAt || Date.now()).toLocaleString('en-NP')}</p>
              <p className="text-xs font-mono">#{receiptData?.transactionNumber || 'TXN-000'}</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {receiptData?.customerName && (
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-500">Customer:</span>
                <span>{receiptData.customerName}</span>
              </div>
            )}

            <div className="mb-2">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Item</span>
                <span>Qty</span>
                <span>Amount</span>
              </div>
              <div className="border-t border-dashed border-gray-300 mb-1" />
              {receiptData?.items?.map((item: any, i: number) => (
                <div key={i} className="text-xs mb-1">
                  <p className="font-medium">{item.productName}</p>
                  <div className="flex justify-between text-gray-600">
                    <span>NPR {Number(item.unitPrice || 0).toFixed(2)}</span>
                    <span>x{item.quantity}</span>
                    <span>NPR {Number(item.amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>NPR {Number(receiptData?.subTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (13%):</span>
                <span>NPR {Number(receiptData?.taxAmount || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-400 my-1" />
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span>NPR {Number(receiptData?.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-400 my-1" />
              <div className="flex justify-between">
                <span>Payment ({receiptData?.paymentMethod || 'Cash'}):</span>
                <span>NPR {Number(receiptData?.amountPaid || 0).toFixed(2)}</span>
              </div>
              {Number(receiptData?.change || 0) > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Change:</span>
                  <span>NPR {Number(receiptData?.change || 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="text-center text-xs text-gray-500 mt-2">
              <p>Thank you for your purchase!</p>
              <p>Powered by BizCore</p>
            </div>
          </div>

          <div className="no-print flex gap-2 p-4 border-t bg-background">
            <Button type="button" variant="outline" className="flex-1" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
            <Button type="button" className="flex-1" onClick={handleNewSale}>
              New Sale
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="no-print absolute top-3 right-3 rounded-full h-8 w-8"
            onClick={() => setShowReceipt(false)}
          >
            <X size={16} />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
