import { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Printer, 
  Calculator,
  ChevronRight,
  Info,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { reportApi } from '../api/api';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function VatReport() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getVatReport({ month, year });
      setReport(res.data.data);
    } catch (error) {
      toast.error("Failed to load VAT report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading && !report) return <div className="p-10 text-center font-bold animate-pulse text-muted-foreground">Generating VAT Report...</div>;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-muted/50">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <FileCheck2 className="w-8 h-8 text-primary" />
            Nepal VAT Report
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="font-bold text-[10px] bg-primary/5 text-primary border-primary/20">Monthly Filing</Badge>
             <span className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-widest">Fiscal Year: {report?.fiscalYear}</span>
          </div>
        </div>
        <div className="flex gap-3">
           <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px] font-bold border-none bg-muted/20">
                 <SelectValue />
              </SelectTrigger>
              <SelectContent>
                 {months.map((m, i) => (
                    <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
                 ))}
              </SelectContent>
           </Select>
           <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] font-bold border-none bg-muted/20">
                 <SelectValue />
              </SelectTrigger>
              <SelectContent>
                 {years.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                 ))}
              </SelectContent>
           </Select>
           <Button variant="outline" className="font-bold rounded-xl" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
           </Button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-black tracking-widest text-blue-600">Total Sales (Output)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <div className="text-3xl font-black">{formatCurrency(report?.totalSalesAmount || 0)}</div>
                  <div className="flex justify-between items-center mt-2">
                     <span className="text-[10px] font-bold text-muted-foreground tracking-wider">Gross Total</span>
                     <Badge className="bg-blue-600/10 text-blue-600 border-none font-bold text-[10px]">{report?.salesInvoiceCount} Records</Badge>
                  </div>
               </div>
               <div className="pt-4 border-t border-blue-200/30 flex justify-between items-center">
                  <div className="space-y-0.5">
                     <p className="text-[9px] font-black text-muted-foreground">VAT Collected</p>
                     <p className="text-lg font-black text-blue-700">{formatCurrency(report?.vatCollected || 0)}</p>
                  </div>
                  <ArrowUpRight className="w-6 h-6 text-blue-400 opacity-50" />
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/10">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-black tracking-widest text-amber-600">Total Purchase (Input)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <div className="text-3xl font-black">{formatCurrency(report?.totalPurchaseAmount || 0)}</div>
                  <div className="flex justify-between items-center mt-2">
                     <span className="text-[10px] font-bold text-muted-foreground tracking-wider">Gross Total</span>
                     <Badge className="bg-amber-600/10 text-amber-600 border-none font-bold text-[10px]">{report?.purchaseInvoiceCount} Records</Badge>
                  </div>
               </div>
               <div className="pt-4 border-t border-amber-200/30 flex justify-between items-center">
                  <div className="space-y-0.5">
                     <p className="text-[9px] font-black text-muted-foreground">VAT Paid</p>
                     <p className="text-lg font-black text-amber-700">{formatCurrency(report?.vatPaid || 0)}</p>
                  </div>
                  <ArrowDownLeft className="w-6 h-6 text-amber-400 opacity-50" />
               </div>
            </CardContent>
         </Card>

         <Card className={cn(
            "border-none shadow-lg text-white",
            report?.netVatPayable >= 0 ? "bg-slate-900" : "bg-emerald-600"
         )}>
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-black tracking-widest opacity-80">
                  {report?.netVatPayable >= 0 ? "Net VAT Payable" : "Net VAT Receivable (Credit)"}
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center py-6">
               <div className="space-y-1">
                  <div className="text-4xl font-black tracking-tighter">
                     {formatCurrency(Math.abs(report?.netVatPayable || 0))}
                  </div>
                  <p className="text-[10px] font-black tracking-widest opacity-60">Status: {report?.netVatPayable >= 0 ? "Liable" : "Excess Credit"}</p>
               </div>
               <div className="flex justify-center gap-2 pt-2">
                  <div className="p-2 bg-white/10 rounded-full">
                     <Calculator className="w-5 h-5" />
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Detailed Calculation */}
         <Card className="lg:col-span-1 border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30">
               <CardTitle className="text-xs font-black tracking-widest">VAT Computation Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-muted/50">
                  <div className="p-4 flex justify-between items-center group hover:bg-muted/10 transition-colors">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground opacity-70">Taxable Sales (13%)</p>
                        <p className="text-sm font-bold">{formatCurrency(report?.taxableSalesAmount || 0)}</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4 flex justify-between items-center group hover:bg-muted/10 transition-colors">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground opacity-70">VAT Collected (Output)</p>
                        <p className="text-sm font-black text-blue-600">{formatCurrency(report?.vatCollected || 0)}</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4 bg-muted/5 flex justify-center py-2">
                     <div className="h-4 border-l-2 border-dashed border-muted-foreground/30" />
                  </div>
                  <div className="p-4 flex justify-between items-center group hover:bg-muted/10 transition-colors">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground opacity-70">Taxable Purchase (13%)</p>
                        <p className="text-sm font-bold">{formatCurrency(report?.taxablePurchaseAmount || 0)}</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4 flex justify-between items-center group hover:bg-muted/10 transition-colors">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground opacity-70">VAT Paid (Input)</p>
                        <p className="text-sm font-black text-amber-600">{formatCurrency(report?.vatPaid || 0)}</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-6 bg-slate-900 border-t-2 border-primary/30 flex justify-between items-end">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 tracking-widest">Final Net Payable</p>
                        <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(report?.netVatPayable || 0)}</p>
                     </div>
                     <Info className="w-5 h-5 text-slate-500" />
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Transactions List */}
         <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
            <Tabs defaultValue="sales" className="w-full">
               <div className="px-4 border-b bg-muted/10 flex items-center justify-between h-14">
                  <TabsList className="bg-transparent h-full p-0 gap-8">
                     <TabsTrigger 
                        value="sales" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-[10px] tracking-widest h-full"
                     >
                        Sales Transactions
                     </TabsTrigger>
                     <TabsTrigger 
                        value="purchase"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-[10px] tracking-widest h-full"
                     >
                        Purchase Transactions
                     </TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black tracking-widest text-muted-foreground">View All</Button>
               </div>
               
               <TabsContent value="sales" className="m-0 border-none">
                  <div className="max-h-[500px] overflow-auto">
                     <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                           <TableRow>
                              <TableHead className="font-black uppercase text-[9px] tracking-widest">Inv #</TableHead>
                              <TableHead className="font-black uppercase text-[9px] tracking-widest">Date</TableHead>
                              <TableHead className="font-black uppercase text-[9px] tracking-widest">Party / PAN</TableHead>
                              <TableHead className="text-right font-black uppercase text-[9px] tracking-widest">Taxable</TableHead>
                              <TableHead className="text-right font-black uppercase text-[9px] tracking-widest">VAT</TableHead>
                              <TableHead className="text-right font-black uppercase text-[9px] tracking-widest">Total</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {report?.salesTransactions?.map((tx: any, idx: number) => (
                              <TableRow key={idx} className="hover:bg-muted/10 border-muted/50">
                                 <TableCell className="font-black text-[10px] tracking-tight">{tx.invoiceNumber}</TableCell>
                                 <TableCell className="text-[10px] font-bold text-muted-foreground">
                                    {new Date(tx.date).toLocaleDateString()}
                                 </TableCell>
                                 <TableCell>
                                    <div className="text-[10px] font-black uppercase tracking-tight">{tx.partyName}</div>
                                    <div className="text-[9px] text-muted-foreground font-bold">{tx.partyPAN ? `PAN: ${tx.partyPAN}` : "NO PAN"}</div>
                                 </TableCell>
                                 <TableCell className="text-right text-[11px] font-bold">{formatCurrency(tx.taxableAmount)}</TableCell>
                                 <TableCell className="text-right text-[11px] font-black text-blue-600">{formatCurrency(tx.vatAmount)}</TableCell>
                                 <TableCell className="text-right text-[11px] font-black">{formatCurrency(tx.amount)}</TableCell>
                              </TableRow>
                           ))}
                           {!report?.salesTransactions?.length && (
                              <TableRow>
                                 <TableCell colSpan={6} className="text-center py-20 font-black uppercase text-[10px] text-muted-foreground opacity-50">No sales transactions available</TableCell>
                              </TableRow>
                           )}
                        </TableBody>
                     </Table>
                  </div>
               </TabsContent>

               <TabsContent value="purchase" className="m-0 border-none">
                  <div className="max-h-[500px] overflow-auto">
                     <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10">
                           <TableRow>
                              <TableHead className="font-black uppercase text-[9px] tracking-widest">PO / Bill #</TableHead>
                              <TableHead className="font-black uppercase text-[9px] tracking-widest">Date</TableHead>
                              <TableHead className="font-black uppercase text-[9px] tracking-widest">Supplier</TableHead>
                              <TableHead className="text-right font-black uppercase text-[9px] tracking-widest">Taxable</TableHead>
                              <TableHead className="text-right font-black uppercase text-[9px] tracking-widest">VAT</TableHead>
                              <TableHead className="text-right font-black uppercase text-[9px] tracking-widest">Total</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {report?.purchaseTransactions?.map((tx: any, idx: number) => (
                              <TableRow key={idx} className="hover:bg-muted/10 border-muted/50">
                                 <TableCell className="font-black text-[10px] tracking-tight">{tx.invoiceNumber}</TableCell>
                                 <TableCell className="text-[10px] font-bold text-muted-foreground">
                                    {new Date(tx.date).toLocaleDateString()}
                                 </TableCell>
                                 <TableCell>
                                    <div className="text-[10px] font-black uppercase tracking-tight">{tx.partyName}</div>
                                 </TableCell>
                                 <TableCell className="text-right text-[11px] font-bold">{formatCurrency(tx.taxableAmount)}</TableCell>
                                 <TableCell className="text-right text-[11px] font-black text-amber-600">{formatCurrency(tx.vatAmount)}</TableCell>
                                 <TableCell className="text-right text-[11px] font-black">{formatCurrency(tx.amount)}</TableCell>
                              </TableRow>
                           ))}
                           {!report?.purchaseTransactions?.length && (
                              <TableRow>
                                 <TableCell colSpan={6} className="text-center py-20 font-black uppercase text-[10px] text-muted-foreground opacity-50">No purchase transactions available</TableCell>
                              </TableRow>
                           )}
                        </TableBody>
                     </Table>
                  </div>
               </TabsContent>
            </Tabs>
         </Card>
      </div>

      <div className="p-4 bg-muted/20 rounded-2xl flex items-start gap-4 border-2 border-amber-500/20">
         <div className="p-2 bg-amber-500 text-white rounded-lg animate-pulse">
            <Info className="w-5 h-5" />
         </div>
         <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-tight">Compliance Reminder</p>
            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase">
               This report is automatically generated based on transactions recorded for {months[month-1]} {year}. 
               Ensure all sales invoices (including POS) and purchase receipts are uploaded for accurate VAT calculation. 
               Last Date for Monthly Filing: 25th of the following month (BS).
            </p>
         </div>
      </div>
    </div>
  );
}
