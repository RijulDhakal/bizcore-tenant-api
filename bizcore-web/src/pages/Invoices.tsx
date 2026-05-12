import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { invoiceApi, contactApi } from '../api/api';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Printer,
  Send,
  MoreHorizontal,
  Trash2,
  Check
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { amountToWords, formatDateWithBS, validatePAN } from '../utils/nepali';
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
import { Switch } from '../components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

import { NumberInput } from '../components/ui/number-input';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Min 1'),
  unitPrice: z.number().min(0, 'Min 0'),
  amount: z.number(),
});

const invoiceSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  billTo: z.string().optional(),
  issueDate: z.string().min(1, 'Required'),
  dueDate: z.string().min(1, 'Required'),
  paymentTerms: z.string().default('Immediate'),
  buyerPAN: z.string().optional(),
  bankDetails: z.string().optional(),
  termsAndConditions: z.string().optional(),
  isTaxInvoice: z.boolean().default(true),
  applyVat: z.boolean().default(false),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  subTotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const Invoices = () => {
  const [filter, setFilter] = useState<any>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', filter],
    queryFn: () => invoiceApi.getAll(filter),
  });

  const { data: customersData } = useQuery({
    queryKey: ['contacts', 'Customer'],
    queryFn: () => contactApi.getAll({ type: 'Customer' }),
  });

  const invoices = invoicesData?.data?.data || [];
  const customers = customersData?.data?.data || [];

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<any>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billTo: '',
      paymentTerms: 'Immediate',
      buyerPAN: '',
      bankDetails: '',
      termsAndConditions: '',
      isTaxInvoice: true,
      applyVat: false,
      items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
      subTotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      notes: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");
  const watchVat = watch("applyVat");

  // Calculate totals whenever items or VAT changes
  const calculateTotals = () => {
    const subTotal = watchItems.reduce((acc: number, item: any) => acc + (item.quantity * (item.unitPrice || 0)), 0);
    const taxAmount = watchVat ? subTotal * 0.13 : 0;
    const totalAmount = subTotal + taxAmount;
    
    setValue('subTotal', subTotal);
    setValue('taxAmount', taxAmount);
    setValue('totalAmount', totalAmount);
  };

  // Sync totals
  useState(() => {
    calculateTotals();
  });

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      if (values.buyerPAN && !validatePAN(values.buyerPAN)) {
        toast.error('Buyer PAN must be 9 digits');
        return;
      }
      
      if (!values.customerId && !values.customerName) {
        toast.error('Please select a customer or enter a name');
        return;
      }
      
      setIsSubmitting(true);
      
      const payload = {
        customerId: values.customerId || '00000000-0000-0000-0000-000000000000',
        customerName: values.customerName,
        billTo: values.billTo,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        paymentTerms: values.paymentTerms,
        buyerPAN: values.buyerPAN,
        bankDetails: values.bankDetails,
        termsAndConditions: values.termsAndConditions,
        isTaxInvoice: values.isTaxInvoice,
        applyVat: values.applyVat,
        notes: values.notes,
        items: values.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };
      
      await invoiceApi.create(payload);
      toast.success('Invoice created');
      setIsFormOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (error: any) {
      toast.error('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsPaid = async () => {
    if (!selectedInvoice) return;
    try {
      await invoiceApi.markPaid(selectedInvoice.id);
      toast.success('Invoice marked as paid');
      setIsConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground"><Clock className="mr-1 h-3 w-3" /> Draft</Badge>;
      case 1:
        return <Badge className="bg-primary/10 text-primary border-none"><Send className="mr-1 h-3 w-3" /> Sent</Badge>;
      case 2:
        return <Badge className="bg-emerald-100 text-emerald-700 border-none"><CheckCircle2 className="mr-1 h-3 w-3" /> Paid</Badge>;
      case 3:
        return <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-none hover:bg-rose-200"><AlertCircle className="mr-1 h-3 w-3" /> Overdue</Badge>;
      default:
        return null;
    }
  };

  const handleDownloadPdf = async (inv: any) => {
    try {
      const response = await invoiceApi.getPdf(inv.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${inv.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Generate and track customer invoices and payments.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input className="pl-9" placeholder="Search invoices..." />
        </div>
        <div className="md:col-span-3">
          <Select onValueChange={(v) => setFilter({ ...filter, status: v })}>
             <SelectTrigger>
               <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
               <SelectValue placeholder="All Status" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="null">All Status</SelectItem>
               <SelectItem value="0">Draft</SelectItem>
               <SelectItem value="1">Sent</SelectItem>
               <SelectItem value="2">Paid In Full</SelectItem>
               <SelectItem value="3">Overdue</SelectItem>
             </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
           <Input type="date" />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Invoice Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-60 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                       <FileText size={48} className="mb-4 opacity-20" />
                       <p className="text-sm font-medium text-muted-foreground">No invoices found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv: any) => (
                  <TableRow key={inv.id} className="group">
                    <TableCell className="font-bold text-primary">{inv.invoiceNumber}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{inv.customerName?.charAt(0)}</div>
                          <span className="font-medium text-sm">{inv.customerName}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <p className="text-xs font-medium">{formatDateWithBS(inv.issueDate)}</p>
                       <p className="text-[10px] text-rose-500 font-bold mt-0.5">Due: {formatDateWithBS(inv.dueDate)}</p>
                    </TableCell>
                    <TableCell>
                       <p className="font-bold">{formatCurrency(inv.totalAmount)}</p>
                       <p className="text-[9px] text-muted-foreground font-medium uppercase mt-0.5">Tax: {formatCurrency(inv.taxAmount)}</p>
                    </TableCell>
                    <TableCell className="text-center">
                       {getStatusBadge(inv.status)}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             {inv.status !== 2 && (
                                <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setIsConfirmOpen(true); }}>
                                   <Check className="mr-2 h-4 w-4" /> Mark Paid
                                </DropdownMenuItem>
                             )}
                             <DropdownMenuItem onClick={() => handleDownloadPdf(inv)}>
                                <Printer className="mr-2 h-4 w-4" /> Download PDF
                             </DropdownMenuItem>
                             <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* Create Invoice Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
         <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Create New Invoice</DialogTitle>
               <DialogDescription>Fill in the details to generate a new invoice.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label>Customer</Label>
                      <div className="space-y-2">
                        <Select value={watch('customerId') || ''} onValueChange={(v) => setValue('customerId', v === '' ? '' : v)}>
                           <SelectTrigger>
                              <SelectValue placeholder="Select existing customer" />
                           </SelectTrigger>
                           <SelectContent>
                              {customers.map((c: any) => (
                                 <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <Input 
                          {...register('customerName')} 
                          placeholder="Or enter new customer name" 
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                     <Label>Bill To (Optional)</Label>
                     <Input {...register('billTo')} placeholder="Billing name (if different)" />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value={watch('paymentTerms')} onValueChange={(v) => setValue('paymentTerms', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                        <SelectItem value="Net 7">Net 7</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Buyer PAN</Label>
                    <Input {...register('buyerPAN')} placeholder="Buyer PAN number" maxLength={9} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <Input type="date" {...register('issueDate')} />
                     </div>
                     <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" {...register('dueDate')} />
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Line Items</h3>
                     <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, amount: 0 })}>
                        <Plus className="mr-1 h-3 w-3" /> Add Item
                     </Button>
                  </div>

                  <div className="space-y-3">
                     {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 bg-muted/10 relative group">
                           <div className="grid grid-cols-12 gap-4">
                              <div className="col-span-6 space-y-1">
                                 <Label className="text-[10px]">Description</Label>
                                 <Input {...register(`items.${index}.description` as const)} placeholder="Item or Service" />
                              </div>
                               <div className="col-span-2 space-y-1">
                                 <Label className="text-[10px]">Qty</Label>
                                 <NumberInput 
                                    onValueChange={() => calculateTotals()}
                                    {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} 
                                 />
                              </div>
                              <div className="col-span-3 space-y-1">
                                 <Label className="text-[10px]">Unit Price</Label>
                                 <NumberInput 
                                    step="0.01" 
                                    onValueChange={() => calculateTotals()}
                                    {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })} 
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

               <Card className="p-6 bg-muted/20 border-none">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                     <div className="flex items-center gap-3">
                        <Switch 
                           id="apply-vat" 
                           checked={watchVat} 
                           onCheckedChange={(checked) => {
                              setValue('applyVat', checked);
                              calculateTotals();
                           }} 
                        />
                         <Label htmlFor="apply-vat" className="cursor-pointer font-bold text-xs uppercase tracking-widest">Apply 13% VAT</Label>
                     </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="tax-invoice"
                          checked={watch('isTaxInvoice')}
                          onCheckedChange={(checked) => setValue('isTaxInvoice', checked)}
                        />
                        <Label htmlFor="tax-invoice" className="cursor-pointer font-bold text-xs uppercase tracking-widest">VAT Invoice (13%)</Label>
                      </div>
                     <div className="text-right space-y-2">
                         <div className="flex justify-end gap-10 text-xs font-medium text-muted-foreground">
                           <span>Subtotal</span>
                           <span className="font-bold">{formatCurrency(watch('subTotal'))}</span>
                        </div>
                        {watchVat && (
                           <div className="flex justify-end gap-10 text-xs font-medium text-emerald-600">
                              <span>VAT (13%)</span>
                              <span className="font-bold">+{formatCurrency(watch('taxAmount'))}</span>
                           </div>
                        )}
                         <div className="flex justify-end gap-10 pt-4 border-t items-baseline">
                           <span className="text-sm font-bold uppercase tracking-widest">Total Amount</span>
                           <span className="text-3xl font-black text-primary leading-none">{formatCurrency(watch('totalAmount'))}</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic mt-1">In Words: {amountToWords(watch('totalAmount') || 0)}</p>
                     </div>
                  </div>
               </Card>

                  <div className="space-y-2">
                    <Label>Bank Details for Payment</Label>
                    <Textarea
                      {...register('bankDetails')}
                      placeholder={'Bank: Nepal Bank Limited\nAccount: 1234567890\nBranch: Kathmandu'}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      {...register('termsAndConditions')}
                      placeholder="Goods once sold will not be returned..."
                      rows={3}
                    />
                  </div>

               <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea {...register('notes')} placeholder="Instructions or bank details..." rows={3} />
               </div>

               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Create Invoice
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Mark as Paid?</DialogTitle>
               <DialogDescription>
                  This will record a payment receipt and settle the outstanding balance for Invoice {selectedInvoice?.invoiceNumber}.
               </DialogDescription>
            </DialogHeader>
            <DialogFooter>
               <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
               <Button onClick={markAsPaid}>Mark as Paid</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};
