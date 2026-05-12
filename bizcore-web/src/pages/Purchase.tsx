import { useState } from 'react';
import { usePurchase } from '../hooks/usePurchase';
import { 
  ShoppingCart, 
  Plus, 
  FileText, 
  User, 
  Trash2, 
  Loader2, 
  Send, 
  XCircle, 
  PackageCheck, 
  Truck,
  MoreHorizontal,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Card, 
  CardContent, 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { purchaseApi } from '../api/purchase.api';
import { contactApi } from '../api/api';
import { inventoryApi } from '../api/inventory.api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { NumberInput } from '../components/ui/number-input';

const poItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Min 1'),
  unitCost: z.number().min(0, 'Min 0'),
  amount: z.number(),
});

const poSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.string().min(1, 'Required'),
  expectedDelivery: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1, 'At least one item'),
  totalAmount: z.number(),
});

type POFormValues = z.infer<typeof poSchema>;

export default function Purchase() {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Draft' | 'Pending Approval' | 'Received' | 'Cancelled'>('All');
  const { orders, analytics } = usePurchase();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'receive' | 'cancel' | 'send' | 'approve' | 'reject', id: string, number?: string } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const getStatusFromFilter = (filter: string) => {
    switch (filter) {
      case 'Draft': return 'Draft';
      case 'Pending Approval': return 'PendingApproval';
      case 'Received': return 'GRNComplete,GRNPartial';
      case 'Cancelled': return 'Cancelled';
      default: return undefined;
    }
  };

  const queryParams = activeFilter === 'All' ? {} : { status: getStatusFromFilter(activeFilter) };
  const { data: ordersData, isLoading: isOrdersLoading } = orders(queryParams);
  const { data: statsData, isLoading: isStatsLoading } = analytics;

  const { data: suppliersData } = useQuery({
    queryKey: ['contacts', 'Supplier'],
    queryFn: () => contactApi.getAll({ type: 'Supplier' }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: () => inventoryApi.getProducts(),
  });

  const products = productsData?.data?.data || productsData?.data || [];

   const ordersRaw = ordersData?.data ?? ordersData ?? [];
   const orderList = Array.isArray(ordersRaw) ? ordersRaw : [];

   const statsRaw = statsData?.data ?? statsData ?? {};
   const stats = {
      totalSpend: Number(statsRaw?.totalSpend ?? statsRaw?.TotalSpend ?? 0),
      topSupplierName: statsRaw?.topSupplierName ?? statsRaw?.TopSupplierName ?? null,
   };

  const suppliers = suppliersData?.data?.data || [];

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
      notes: '',
      items: [{ productId: '', quantity: 1, unitCost: 0, amount: 0 }],
      totalAmount: 0,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");

  const calculateTotal = () => {
    const total = watchItems.reduce((acc, item) => acc + (item.quantity * (item.unitCost || 0)), 0);
    setValue('totalAmount', total);
  };

  const onSubmit = async (values: POFormValues) => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        supplierId: values.supplierId,
        orderDate: values.orderDate,
        expectedDelivery: values.expectedDelivery || null,
        notes: values.notes || null,
        items: values.items.map((item: any) => ({
          productId: item.productId,
          description: products.find((p: any) => p.id === item.productId)?.name || item.productId,
          quantity: item.quantity,
          unitPrice: item.unitCost,
          unit: products.find((p: any) => p.id === item.productId)?.unit || 'pcs'
        }))
      };
      
      await purchaseApi.createOrder(payload);
      toast.success('Purchase order created');
      setIsFormOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'analytics'] });
    } catch (err) {
      toast.error('Failed to create PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    setIsSubmitting(true);
    try {
      let result;
      if (confirmAction.type === 'receive') result = await purchaseApi.receiveOrder(confirmAction.id);
      else if (confirmAction.type === 'send') result = await purchaseApi.sendOrder(confirmAction.id);
      else if (confirmAction.type === 'cancel') result = await purchaseApi.cancelOrder(confirmAction.id);
      else if (confirmAction.type === 'approve') result = await purchaseApi.approveOrder(confirmAction.id, actionNotes || undefined);
      else if (confirmAction.type === 'reject') result = await purchaseApi.rejectOrder(confirmAction.id, actionNotes);
      
      // Check if the API call actually succeeded
      if (result && result.success) {
        toast.success(
          `Order ${
            confirmAction.type === 'receive'
              ? 'received'
              : confirmAction.type === 'send'
                ? 'submitted'
                : confirmAction.type === 'approve'
                  ? 'approved'
                  : confirmAction.type === 'reject'
                    ? 'rejected'
                    : 'cancelled'
          } successfully`
        );
        queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] });
        queryClient.invalidateQueries({ queryKey: ['purchase', 'analytics'] });
        queryClient.invalidateQueries({ queryKey: ['purchase', 'receipts'] });
        queryClient.invalidateQueries({ queryKey: ['purchase', 'orders', 'pending-approval'] });
      } else {
        // Show the actual error message from the backend
        toast.error(result?.message || 'Action failed');
      }
    } catch (error: any) {
      // Handle network or other errors
      const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      setActionNotes('');
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: return <Badge variant="secondary" className="bg-slate-100 text-slate-600 uppercase text-[9px] font-bold">Draft</Badge>;
      case 1: return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none uppercase text-[9px] font-bold">Pending Approval</Badge>;
      case 2: return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none uppercase text-[9px] font-bold">Approved</Badge>;
      case 3: return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none uppercase text-[9px] font-bold">Rejected</Badge>;
      case 4: return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none uppercase text-[9px] font-bold">Partial Receipt</Badge>;
      case 5: return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none uppercase text-[9px] font-bold">GRN Complete</Badge>;
      case 6: return <Badge className="bg-slate-700 text-white hover:bg-slate-800 border-none uppercase text-[9px] font-bold">Closed</Badge>;
      case 7: return <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-200 border-none uppercase text-[9px] font-bold">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Manage supplier purchase orders and incoming stock.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isStatsLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <>
            <Card>
               <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                     <TrendingDown className="h-4 w-4 text-rose-500" />
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Spend</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Overall purchase volume</p>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                     <ShoppingCart className="h-4 w-4 text-primary" />
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Orders</p>
                  </div>
                   <p className="text-2xl font-bold">
                      {orderList.filter((o: any) => o.status === 0 || o.status === 1 || o.status === 2 || o.status === 4).length}
                   </p>
                  <p className="text-[10px] text-muted-foreground mt-2">Orders in progress</p>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                     <User className="h-4 w-4 text-amber-500" />
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Top Supplier</p>
                  </div>
                  <p className="text-xl font-bold truncate">{stats.topSupplierName || '—'}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Highest volume partner</p>
               </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'Draft', 'Pending Approval', 'Received', 'Cancelled'].map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? 'default' : 'outline'}
            size="sm"
            className="text-[10px] uppercase font-bold tracking-widest px-6"
            onClick={() => setActiveFilter(f as any)}
          >
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Reference</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Timeline</TableHead>
                 <TableHead>Total Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isOrdersLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orderList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-60 text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto h-12 w-12 opacity-10 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">No orders found</p>
                  </TableCell>
                </TableRow>
              ) : (
                orderList.map((order: any) => (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-bold text-primary">{order.poNumber}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <Truck size={14} className="text-muted-foreground" />
                          <span className="font-medium text-sm">{order.supplierName}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <p className="text-xs font-medium">{formatDate(order.orderDate)}</p>
                       {order.expectedDelivery && <p className="text-[10px] text-muted-foreground mt-0.5 italic">Est: {formatDate(order.expectedDelivery)}</p>}
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                              {order.status === 0 && (
                                 <DropdownMenuItem onClick={() => { setConfirmAction({ type: 'send', id: order.id, number: order.poNumber }); setActionNotes(''); setIsConfirmOpen(true); }}>
                                     <Send className="mr-2 h-4 w-4" /> Send PO
                                  </DropdownMenuItem>
                               )}
                               {order.status === 1 && (
                                  <>
                                     <DropdownMenuItem onClick={() => { setConfirmAction({ type: 'approve', id: order.id, number: order.poNumber }); setActionNotes(''); setIsConfirmOpen(true); }}>
                                        <PackageCheck className="mr-2 h-4 w-4" /> Approve
                                     </DropdownMenuItem>
                                     <DropdownMenuItem className="text-destructive" onClick={() => { setConfirmAction({ type: 'reject', id: order.id, number: order.poNumber }); setActionNotes(''); setIsConfirmOpen(true); }}>
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                     </DropdownMenuItem>
                                  </>
                               )}
                               {order.status === 2 && (
                                 <DropdownMenuItem onClick={() => { setConfirmAction({ type: 'receive', id: order.id, number: order.poNumber }); setActionNotes(''); setIsConfirmOpen(true); }}>
                                     <PackageCheck className="mr-2 h-4 w-4" /> Receive Items
                                  </DropdownMenuItem>
                               )}
                              {order.status < 2 && (
                                <DropdownMenuItem className="text-destructive" onClick={() => { setConfirmAction({ type: 'cancel', id: order.id, number: order.poNumber }); setActionNotes(''); setIsConfirmOpen(true); }}>
                                    <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                                 </DropdownMenuItem>
                              )}
                             <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" /> View Audit Log
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* PO Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
         <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Create Purchase Order</DialogTitle>
               <DialogDescription>Create a new purchase order for a supplier.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label>Supplier *</Label>
                     <Select value={watch('supplierId')} onValueChange={(v) => setValue('supplierId', v)}>
                        <SelectTrigger>
                           <SelectValue placeholder="Select Supplier" />
                        </SelectTrigger>
                        <SelectContent>
                           {suppliers.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     {errors.supplierId && <p className="text-rose-500 text-[10px] font-bold mt-1">{errors.supplierId.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Order Date</Label>
                        <Input type="date" {...register('orderDate')} />
                     </div>
                     <div className="space-y-2">
                        <Label>Expected Inbound</Label>
                        <Input type="date" {...register('expectedDelivery')} />
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order Items</h3>
                     <button type="button" className="flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => append({ productId: '', quantity: 1, unitCost: 0, amount: 0 })}>
                        <Plus className="h-3 w-3" /> Add Item
                     </button>
                  </div>

                  <div className="space-y-3">
                     {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 bg-muted/5">
                           <div className="grid grid-cols-12 gap-4">
                               <div className="col-span-6 space-y-1">
                                  <Label className="text-[10px]">Product</Label>
                                  <Select onValueChange={(v) => setValue(`items.${index}.productId`, v)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                               </div>
                              <div className="col-span-2 space-y-1">
                                 <Label className="text-[10px]">Quantity</Label>
                                 <NumberInput 
                                    onValueChange={() => calculateTotal()}
                                    {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} 
                                 />
                              </div>
                              <div className="col-span-3 space-y-1">
                                 <Label className="text-[10px]">Unit Cost</Label>
                                 <NumberInput 
                                    step="0.01" 
                                    onValueChange={() => calculateTotal()}
                                    {...register(`items.${index}.unitCost` as const, { valueAsNumber: true })} 
                                 />
                              </div>
                              <div className="col-span-1 flex items-center justify-center pt-5">
                                 <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>
                        </Card>
                     ))}
                  </div>
               </div>

               <Card className="p-6 bg-primary/5 border-primary/10">
                  <div className="flex justify-between items-baseline">
                     <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Total Amount</p>
                     <p className="text-4xl font-black text-primary leading-none">{formatCurrency(watch('totalAmount'))}</p>
                  </div>
               </Card>

               <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea {...register('notes')} placeholder="Add any special instructions..." rows={3} />
               </div>

               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Discard</Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Create Order
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Action Dialog */}
       <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
             <DialogHeader>
                <DialogTitle className="font-bold text-xl capitalize">
                   {confirmAction?.type} Order
                </DialogTitle>
                <DialogDescription>
                   Are you sure you want to {confirmAction?.type} order {confirmAction?.number}? This action cannot be undone.
                </DialogDescription>
             </DialogHeader>

             {(confirmAction?.type === 'approve' || confirmAction?.type === 'reject') && (
               <div className="space-y-2 pt-2">
                 <Label>{confirmAction?.type === 'reject' ? 'Rejection reason *' : 'Notes (optional)'}</Label>
                 <Textarea
                   value={actionNotes}
                   onChange={(e) => setActionNotes(e.target.value)}
                   placeholder={confirmAction?.type === 'reject' ? 'Why is this PO rejected?' : 'Add any approval notes...'}
                   rows={3}
                 />
               </div>
             )}

             <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                <Button
                  variant={confirmAction?.type === 'cancel' || confirmAction?.type === 'reject' ? 'destructive' : 'default'}
                  onClick={handleAction}
                  disabled={
                    isSubmitting ||
                    (confirmAction?.type === 'reject' && actionNotes.trim().length === 0)
                  }
                >
                   Confirm
                </Button>
             </DialogFooter>
          </DialogContent>
       </Dialog>
    </div>
  );
}
