import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Receipt,
  TrendingUp,
  DollarSign,
  CreditCard,
  Tag,
  Info
} from 'lucide-react';
import { expensesApi } from '../api/api';
import { formatCurrency } from '../utils/format';
import { adToBS } from '../utils/nepali';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { Switch } from '../components/ui/switch';

const CATEGORY_COLORS: Record<string, string> = {
  Rent: "bg-blue-100 text-blue-700 border-blue-200",
  Electricity: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Salary: "bg-purple-100 text-purple-700 border-purple-200",
  Transport: "bg-orange-100 text-orange-700 border-orange-200",
  Marketing: "bg-pink-100 text-pink-700 border-pink-200",
  Maintenance: "bg-gray-100 text-gray-700 border-gray-200",
  Office: "bg-teal-100 text-teal-700 border-teal-200",
  "Office Supplies": "bg-teal-100 text-teal-700 border-teal-200",
  Communication: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Tax: "bg-red-100 text-red-700 border-red-200",
  Other: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function Expenses() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    amount: "",
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMode: "Cash",
    reference: "",
    notes: "",
    vendorName: "",
    isRecurring: false,
    recurringFrequency: "Monthly"
  });

  const { data: expensesData, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses', categoryFilter],
    queryFn: async () => {
      const res = await expensesApi.getAll({ category: categoryFilter !== "All" ? categoryFilter : undefined });
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['expenses-summary', categoryFilter],
    queryFn: async () => {
      const res = await expensesApi.getSummary();
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const expenses = expensesData || [];
  const summary = summaryData || null;
  const loading = isExpensesLoading || isSummaryLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, amount: parseFloat(formData.amount) };
      if (editingId) {
        await expensesApi.update(editingId, data);
        toast.success("Expense updated");
      } else {
        await expensesApi.create(data);
        toast.success(`Expense saved! NPR ${data.amount} deducted from Cash Book`);
      }
      setIsAddOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      amount: "",
      expenseDate: new Date().toISOString().split('T')[0],
      paymentMode: "Cash",
      reference: "",
      notes: "",
      vendorName: "",
      isRecurring: false,
      recurringFrequency: "Monthly"
    });
    setEditingId(null);
  };

  const handleEdit = (expense: any) => {
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount.toString(),
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      paymentMode: expense.paymentMode,
      reference: expense.reference || "",
      notes: expense.notes || "",
      vendorName: expense.vendorName || "",
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency || "Monthly"
    });
    setEditingId(expense.id);
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await expensesApi.delete(id);
      toast.success("Expense deleted");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const filteredExpenses = expenses.filter((e: any) => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    (e.vendorName && e.vendorName.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading && !summary) return <div className="p-10 text-center font-black animate-pulse uppercase tracking-[0.3em] opacity-40">Loading Expenses...</div>;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Receipt className="w-8 h-8 text-primary" />
            EXPENSE MANAGEMENT
          </h1>
          <p className="text-muted-foreground font-medium">Track and analyze business expenses</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="font-bold">
          <Plus className="w-5 h-5 mr-2" /> Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Expenses</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(summary?.totalExpenses || 0)}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">All time total</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Largest Category</CardTitle>
            <Tag className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{summary?.largestCategory || "N/A"}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Top spending area</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Transaction Count</CardTitle>
            <Edit2 className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{summary?.expenseCount || 0}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Total entries made</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Largest Expense</CardTitle>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(summary?.largestExpense || 0)}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Single highest amount</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <Card className="lg:col-span-1 border-none shadow-md bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {summary?.byCategory?.slice(0, 6).map((cat: any) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                  <span className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", (CATEGORY_COLORS[cat.category] || "bg-gray-400").split(' ')[0])} />
                    {cat.category}
                  </span>
                  <span>{formatCurrency(cat.total)} ({cat.percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden border border-muted">
                  <div 
                    className={cn("h-full transition-all duration-500", (CATEGORY_COLORS[cat.category] || "bg-gray-400").split(' ')[0])}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {!summary?.byCategory?.length && <p className="text-center text-muted-foreground py-8 font-black uppercase text-[10px]">No data available</p>}
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
          <div className="p-4 border-b bg-muted/10 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by title or vendor..." 
                  className="pl-9 bg-background border-none shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] bg-background border-none shadow-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {summary?.byCategory?.map((c: any) => (
                    <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Details</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Category</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Payment</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Amount</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense: any) => (
                <TableRow key={expense.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell>
                    <div className="font-bold text-xs">{new Date(expense.expenseDate).toLocaleDateString()}</div>
                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-70">
                      {adToBS(new Date(expense.expenseDate))} BS
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-black uppercase tracking-tight text-xs">{expense.title}</div>
                    <div className="text-[10px] text-muted-foreground italic">{expense.vendorName || "No Vendor"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-bold text-[9px] uppercase tracking-widest", CATEGORY_COLORS[expense.category])}>
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <CreditCard className="w-3 h-3 text-muted-foreground" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{expense.paymentMode}</span>
                    </div>
                    {expense.reference && <div className="text-[9px] text-muted-foreground mt-0.5">#{expense.reference}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-black text-rose-600 text-sm tracking-tighter">{formatCurrency(expense.amount)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)} className="h-8 w-8 text-blue-600">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="h-8 w-8 text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredExpenses.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-black uppercase text-xs">
                    No expenses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              {editingId ? "Edit Expense" : "New Expense Entry"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Title (Required)</Label>
                <Input 
                  placeholder="e.g. Office Rent - March" 
                  value={formData.title} 
                  required
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-muted/10 border-none font-bold placeholder:font-normal"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})} required>
                  <SelectTrigger className="bg-muted/10 border-none font-bold">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Rent", "Electricity", "Water", "Internet", "Salary", "Transport", "Marketing", "Maintenance", "Office Supplies", "Communication", "Tax", "Other"].map(opt => (
                      <SelectItem key={opt} value={opt} className="font-medium">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Amount (NPR)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={formData.amount} 
                  required
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="bg-muted/10 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Expense Date</Label>
                <Input 
                  type="date" 
                  value={formData.expenseDate} 
                  onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                  className="bg-muted/10 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Payment Mode</Label>
                <Select value={formData.paymentMode} onValueChange={(v) => setFormData({...formData, paymentMode: v})}>
                  <SelectTrigger className="bg-muted/10 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Cash", "Bank Transfer", "Cheque", "eSewa", "Khalti", "Other"].map(opt => (
                      <SelectItem key={opt} value={opt} className="font-medium">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                  <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg text-xs text-blue-700 border border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/10">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>
                      This expense will automatically reduce your 
                      <strong className="mx-1 font-black underline uppercase">{formData.paymentMode}</strong> 
                      balance in Cash Book.
                    </span>
                  </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Vendor / Paid To</Label>
                <Input 
                  placeholder="Optional" 
                  value={formData.vendorName} 
                  onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                  className="bg-muted/10 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Reference #</Label>
                <Input 
                  placeholder="Receipt/Cheque" 
                  value={formData.reference} 
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="bg-muted/10 border-none font-bold"
                />
              </div>
              <div className="col-span-2 space-y-3 p-4 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Is Recurring Expense?</Label>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold opacity-60">Automate future entries</p>
                  </div>
                  <Switch 
                    checked={formData.isRecurring} 
                    onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked})} 
                  />
                </div>
                {formData.isRecurring && (
                  <Select value={formData.recurringFrequency} onValueChange={(v) => setFormData({...formData, recurringFrequency: v})}>
                    <SelectTrigger className="bg-background border-none shadow-sm h-8 text-[11px] font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Weekly", "Monthly", "Quarterly", "Yearly"].map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <DialogFooter className="pt-4">
               <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="font-bold">Cancel</Button>
               <Button type="submit" className="font-black uppercase tracking-widest text-xs px-8">
                 {editingId ? "Update Expense" : "Save Expense"}
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
