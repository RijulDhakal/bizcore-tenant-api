import { useState } from 'react';
import { useHR } from '../hooks/useHR';
import { 
  Users, 
  UserPlus, 
  Clock, 
  FileText, 
  Plus, 
  Search, 
  Edit2, 
  CheckCircle, 
  Wallet,
  Filter,
  Loader2,
   MessageSquare
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
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
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger,
  TabsContent
} from '../components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { hrApi } from '../api/hr.api';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../components/ui/utils';
import { NumberInput } from '../components/ui/number-input';
import { validatePAN } from '../utils/nepali';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  department: z.string().optional(),
  joinDate: z.string().min(1, 'Join date is required'),
  employmentType: z.number(),
  basicSalary: z.number().min(0, 'Salary must be positive'),
   citizenshipNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  panNumber: z.string().optional(),
   houseRentAllowance: z.number().min(0).default(0),
   transportAllowance: z.number().min(0).default(0),
   medicalAllowance: z.number().min(0).default(0),
   dearnesAllowance: z.number().min(0).default(0),
   pfDeductionPercent: z.number().min(0).default(10),
   ssfDeductionPercent: z.number().min(0).default(1),
   isTdsApplicable: z.boolean().default(false),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

import { useSearchParams } from 'react-router-dom';

export default function HR() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'employees');
  const [search, setSearch] = useState('');
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resolution, setResolution] = useState({ response: '', status: 'Resolved' });
  
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const queryClient = useQueryClient();
   const { employees, leaves, payroll, payrollSummary, assistanceRequests } = useHR({ 
    search, 
    month, 
      year,
      includeEmployees: activeTab === 'employees',
      includeAttendance: activeTab === 'attendance',
      includeLeaves: activeTab === 'leaves',
      includePayroll: activeTab === 'payroll',
      includePayrollSummary: activeTab === 'payroll',
      includeAssistance: activeTab === 'inbox'
  });

   const employeeForm = useForm<any>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employmentType: 0,
      basicSalary: 0,
         citizenshipNumber: '',
         houseRentAllowance: 0,
         transportAllowance: 0,
         medicalAllowance: 0,
         dearnesAllowance: 0,
         pfDeductionPercent: 10,
         ssfDeductionPercent: 1,
         isTdsApplicable: false,
      joinDate: new Date().toISOString().split('T')[0]
    }
  });

   const basicSalary = employeeForm.watch('basicSalary') || 0;
   const hra = employeeForm.watch('houseRentAllowance') || 0;
   const transport = employeeForm.watch('transportAllowance') || 0;
   const medical = employeeForm.watch('medicalAllowance') || 0;
   const dearness = employeeForm.watch('dearnesAllowance') || 0;
   const pfPercent = employeeForm.watch('pfDeductionPercent') || 0;
   const ssfPercent = employeeForm.watch('ssfDeductionPercent') || 0;
   const tdsApplicable = employeeForm.watch('isTdsApplicable') || false;
   const grossSalary = basicSalary + hra + transport + medical + dearness;
   const pfDeduction = basicSalary * (pfPercent / 100);
   const ssfDeduction = grossSalary * (ssfPercent / 100);
   const tds = tdsApplicable ? grossSalary * 0.01 : 0;
   const totalDeductions = pfDeduction + ssfDeduction + tds;
   const netSalary = grossSalary - totalDeductions;

  const handleSaveEmployee = async (data: EmployeeFormValues) => {
    try {
      if (data.panNumber && !validatePAN(data.panNumber)) {
        toast.error('PAN must be 9 digits');
        return;
      }
      setIsSubmitting(true);
      
      const payload = {
        ...data,
        joinDate: new Date(data.joinDate).toISOString(), // Ensure UTC string
        employmentType: Number(data.employmentType),
        PANNumber: data.panNumber, // Fix property case for backend mapping
        IsTDSApplicable: data.isTdsApplicable, // Correct property case
      };

      const res = selectedEmployee 
        ? await hrApi.updateEmployee(selectedEmployee.id, payload)
        : await hrApi.createEmployee(payload);
      
      if (res.success) {
        toast.success(selectedEmployee ? 'Employee updated' : 'Employee created');
        setIsEmployeeOpen(false);
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      }
    } catch (error) {
      toast.error('Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      const res = await hrApi.generatePayroll(month, year);
      if (res.success) {
        toast.success(res.message || 'Payroll generated');
        queryClient.invalidateQueries({ queryKey: ['payroll'] });
        queryClient.invalidateQueries({ queryKey: ['payroll-summary'] });
      }
    } catch (error) {
      toast.error('Failed to generate payroll');
    }
  };

   const handleApproveLeave = async (id: string) => {
      try {
         await hrApi.approveLeave(id);
         toast.success('Leave approved');
         queryClient.invalidateQueries({ queryKey: ['leaves'] });
      } catch {
         toast.error('Failed to approve leave');
      }
   };

   const handleRejectLeave = async (id: string) => {
      try {
         await hrApi.rejectLeave(id);
         toast.success('Leave rejected');
         queryClient.invalidateQueries({ queryKey: ['leaves'] });
      } catch {
         toast.error('Failed to reject leave');
      }
   };

  const employeeList = employees.data?.data || [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR Management</h1>
          <p className="text-sm text-muted-foreground">Manage employees, attendance, and payroll records.</p>
        </div>
        <div className="flex items-center gap-2">
           {activeTab === 'employees' && (
              <Button onClick={() => { setSelectedEmployee(null); employeeForm.reset(); setIsEmployeeOpen(true); }}>
                 <UserPlus className="mr-2 h-4 w-4" /> Add Employee
              </Button>
           )}
           {activeTab === 'payroll' && (
              <Button onClick={handleGeneratePayroll}>
                 <Plus className="mr-2 h-4 w-4" /> Generate Payroll
              </Button>
           )}
        </div>
      </div>

      <Tabs defaultValue="employees" onValueChange={setActiveTab}>
         <TabsList className="mb-6">
            <TabsTrigger value="employees" className="gap-2">
               <Users size={14} /> Employees
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
               <Clock size={14} /> Attendance
            </TabsTrigger>
            <TabsTrigger value="leaves" className="gap-2">
               <FileText size={14} /> Leaves
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-2">
               <Wallet size={14} /> Payroll
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2">
               <MessageSquare size={14} /> Inbox
               {assistanceRequests.data?.data?.filter((r: any) => r.status === 'Pending').length > 0 && (
                  <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center bg-rose-500 text-[8px]">{assistanceRequests.data?.data?.filter((r: any) => r.status === 'Pending').length}</Badge>
               )}
            </TabsTrigger>
         </TabsList>

         <TabsContent value="inbox">
            <div className="space-y-6">
               <Card>
                  <div className="overflow-x-auto">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {assistanceRequests.isLoading ? (
                              Array(3).fill(0).map((_, i) => (
                                 <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                 </TableRow>
                              ))
                           ) : assistanceRequests.data?.data?.length === 0 ? (
                              <TableRow>
                                 <td colSpan={6} className="h-32 text-center text-muted-foreground italic">No assistance requests found.</td>
                              </TableRow>
                           ) : (
                              assistanceRequests.data?.data?.map((r: any) => (
                                 <TableRow key={r.id} className="group hover:bg-muted/30">
                                    <TableCell className="font-bold text-xs uppercase">{r.employeeName}</TableCell>
                                    <TableCell><Badge variant="secondary" className="text-[10px] uppercase">{r.category}</Badge></TableCell>
                                    <TableCell>
                                       <div className="max-w-md">
                                          <p className="font-bold text-sm truncate">{r.subject}</p>
                                          <p className="text-xs text-muted-foreground truncate">{r.message}</p>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                       <Badge className={cn(
                                          "h-6 font-bold text-[9px] uppercase border-none",
                                          r.status === 'Pending' ? "bg-amber-100 text-amber-700" : 
                                          r.status === 'Resolved' ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                                       )}>
                                          {r.status}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-primary hover:text-primary-foreground hover:bg-primary transition-all rounded-full h-8 w-8 p-0"
                                          onClick={() => { setSelectedRequest(r); setIsResolveOpen(true); }}
                                       >
                                          <Edit2 size={14} />
                                       </Button>
                                    </TableCell>
                                 </TableRow>
                              ))
                           )}
                        </TableBody>
                     </Table>
                  </div>
               </Card>
            </div>
         </TabsContent>

         <TabsContent value="employees">
            <div className="space-y-6">
               <div className="flex gap-4">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                     <Input 
                        placeholder="Search employees..." 
                        className="pl-9" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                     />
                  </div>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {employees.isLoading ? (
                     Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)
                  ) : employeeList.length === 0 ? (
                     <div className="col-span-full py-20 text-center opacity-30">
                        <Users size={48} className="mx-auto mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">No employees found.</p>
                     </div>
                  ) : (
                     employeeList.map((emp: any) => (
                        <Card key={emp.id} className="group overflow-hidden border-muted/60 hover:shadow-lg transition-all hover:border-primary/20">
                           <CardContent className="p-0">
                              <div className="p-5 flex items-start justify-between">
                                 <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                                       <AvatarFallback className="bg-primary text-primary-foreground font-black italic">
                                          {emp.firstName[0]}{emp.lastName[0]}
                                       </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                       <h3 className="font-bold text-sm truncate">{emp.firstName} {emp.lastName}</h3>
                                       <Badge variant="outline" className="text-[9px] font-black h-5 mt-1 border-primary/30 text-primary">{emp.employeeCode}</Badge>
                                    </div>
                                 </div>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                    setSelectedEmployee(emp);
                                    employeeForm.reset({ ...emp, joinDate: emp.joinDate.split('T')[0] });
                                    setIsEmployeeOpen(true);
                                 }}>
                                    <Edit2 size={14} />
                                 </Button>
                              </div>

                              <div className="px-5 pb-5 space-y-3">
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Position</p>
                                        <p className="text-xs font-medium truncate">{emp.position}</p>
                                     </div>
                                     <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Department</p>
                                        <p className="text-xs font-medium truncate">{emp.department || '—'}</p>
                                     </div>
                                 </div>
                                 <div className="flex items-center justify-between pt-4 border-t">
                                     <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Basic Salary</p>
                                        <p className="font-bold text-sm">{formatCurrency(emp.basicSalary)}</p>
                                     </div>
                                    <Badge className={cn(
                                       "h-6 font-bold text-[9px] uppercase border-none",
                                       emp.status === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                       {emp.status === 0 ? 'Active' : 'On Leave'}
                                    </Badge>
                                 </div>
                              </div>
                           </CardContent>
                        </Card>
                     ))
                  )}
               </div>
            </div>
         </TabsContent>

         <TabsContent value="leaves">
            <div className="space-y-6">
               <Card>
                  <div className="overflow-x-auto">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Dates</TableHead>
                              <TableHead>Days</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {leaves.isLoading ? (
                              Array(4).fill(0).map((_, i) => (
                                 <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                 </TableRow>
                              ))
                           ) : leaves.data?.data?.length === 0 ? (
                              <TableRow>
                                 <td colSpan={7} className="h-24 text-center text-muted-foreground italic">No leave requests found.</td>
                              </TableRow>
                           ) : (
                              leaves.data?.data?.map((l: any) => (
                                 <TableRow key={l.id}>
                                    <TableCell className="font-bold text-xs uppercase">{l.employeeName}</TableCell>
                                    <TableCell className="text-sm">{String(l.leaveType)}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                       {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-semibold">{l.totalDays}</TableCell>
                                    <TableCell>
                                       <Badge className={cn(
                                          "h-6 font-bold text-[9px] uppercase border-none",
                                          l.status === 0 ? "bg-amber-100 text-amber-700" :
                                          l.status === 1 ? "bg-emerald-100 text-emerald-700" :
                                          l.status === 2 ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground"
                                       )}>
                                          {l.status === 0 ? 'Pending' : l.status === 1 ? 'Approved' : l.status === 2 ? 'Rejected' : 'Cancelled'}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">{l.reason || '-'}</TableCell>
                                    <TableCell className="text-right">
                                       {l.status === 0 ? (
                                          <div className="inline-flex gap-2">
                                             <Button size="sm" variant="outline" onClick={() => void handleApproveLeave(l.id)}>Approve</Button>
                                             <Button size="sm" variant="outline" onClick={() => void handleRejectLeave(l.id)}>Reject</Button>
                                          </div>
                                       ) : (
                                          <span className="text-xs text-muted-foreground">-</span>
                                       )}
                                    </TableCell>
                                 </TableRow>
                              ))
                           )}
                        </TableBody>
                     </Table>
                  </div>
               </Card>
            </div>
         </TabsContent>

         <TabsContent value="payroll">
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-primary/5 border-primary/20">
                     <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-primary/10 text-primary"><Wallet size={20} /></div>
                           <div>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Payroll</p>
                              <p className="text-2xl font-bold">{formatCurrency(payrollSummary.data?.data?.totalPayrollCost || 0)}</p>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
                  <Card>
                     <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><CheckCircle size={20} /></div>
                           <div>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Paid</p>
                              <p className="text-2xl font-bold">{payrollSummary.data?.data?.paidCount || 0}</p>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
                  <Card>
                     <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><Clock size={20} /></div>
                           <div>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending</p>
                              <p className="text-2xl font-bold">{payrollSummary.data?.data?.pendingCount || 0}</p>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               <Card>
                  <div className="overflow-x-auto">
                     <Table>
                        <TableHeader>
                           <TableRow>
                               <TableHead>Employee</TableHead>
                              <TableHead>Basic Salary</TableHead>
                              <TableHead>Adjustments</TableHead>
                              <TableHead>Net Salary</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {payroll.isLoading ? (
                              Array(5).fill(0).map((_, i) => (
                                 <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                 </TableRow>
                              ))
                           ) : payroll.data?.data?.map((p: any) => (
                              <TableRow key={p.id}>
                                 <TableCell>
                                    <div className="flex items-center gap-3">
                                       <Avatar className="h-8 w-8 border border-muted/50">
                                          <AvatarFallback className="text-[10px] font-bold">{p.employeeName[0]}</AvatarFallback>
                                       </Avatar>
                                        <span className="font-bold text-sm uppercase">{p.employeeName}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="font-bold text-sm">{formatCurrency(p.basicSalary)}</TableCell>
                                 <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                       <p className="text-[10px] text-emerald-600 font-bold">+{formatCurrency(p.allowances)}</p>
                                       <p className="text-[10px] text-rose-500 font-bold">-{formatCurrency(p.deductions)}</p>
                                    </div>
                                 </TableCell>
                                  <TableCell className="font-black text-sm text-primary">{formatCurrency(p.netSalary)}</TableCell>
                                 <TableCell className="text-center">
                                    <Badge className={cn(
                                       "h-6 font-bold text-[9px] uppercase border-none",
                                       p.paymentStatus === 1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                       {p.paymentStatus === 1 ? 'Paid' : 'Pending'}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="text-right">
                                    {p.paymentStatus === 0 && (
                                       <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={async () => {
                                           await hrApi.payPayroll(p.id);
                                          toast.success('Payment successful');
                                          queryClient.invalidateQueries({ queryKey: ['payroll'] });
                                       }}>
                                          <CheckCircle size={16} />
                                       </Button>
                                    )}
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </div>
               </Card>
            </div>
         </TabsContent>
      </Tabs>

      {/* Employee Dialog */}
      <Dialog open={isEmployeeOpen} onOpenChange={setIsEmployeeOpen}>
         <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
               <DialogDescription>Fill in the details to save employee information.</DialogDescription>
            </DialogHeader>
            <form onSubmit={employeeForm.handleSubmit(handleSaveEmployee)} className="space-y-6 py-4">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label>First Name *</Label>
                     <Input {...employeeForm.register('firstName')} placeholder="Given Name" />
                  </div>
                  <div className="space-y-2">
                     <Label>Last Name *</Label>
                     <Input {...employeeForm.register('lastName')} placeholder="Family Name" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label>Email</Label>
                     <Input type="email" {...employeeForm.register('email')} placeholder="Email Address" />
                  </div>
                  <div className="space-y-2">
                     <Label>Phone Number</Label>
                      <Input {...employeeForm.register('phone')} placeholder="Phone Number" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label>Position *</Label>
                     <Input {...employeeForm.register('position')} placeholder="e.g. Manager" />
                  </div>
                  <div className="space-y-2">
                      <Label>Department</Label>
                     <Input {...employeeForm.register('department')} placeholder="Department Name" />
                  </div>
               </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label>Basic Salary *</Label>
                     <NumberInput {...employeeForm.register('basicSalary', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                     <Label>Employment Type *</Label>
                     <Select
                       defaultValue={employeeForm.getValues('employmentType').toString()}
                       onValueChange={(v) => employeeForm.setValue('employmentType', parseInt(v))}
                     >
                        <SelectTrigger>
                           <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="0">Full Time</SelectItem>
                           <SelectItem value="1">Part Time</SelectItem>
                           <SelectItem value="2">Contract</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                     <Label>Join Date *</Label>
                      <Input type="date" {...employeeForm.register('joinDate')} />
                  </div>
               </div>

               <div className="border-t pt-6 space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bank & Identity Details</h4>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label>Citizenship Number</Label>
                        <Input {...employeeForm.register('citizenshipNumber')} placeholder="XX-XX-XXXXXXXX" />
                     </div>
                     <div className="space-y-2">
                         <Label>PAN Number</Label>
                        <Input {...employeeForm.register('panNumber')} placeholder="9-digit PAN" maxLength={9} />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                         <Label>Bank Name</Label>
                        <Input {...employeeForm.register('bankName')} />
                     </div>
                  </div>
                  <div className="space-y-2">
                      <Label>Bank Account Number</Label>
                     <Input {...employeeForm.register('bankAccountNumber')} />
                  </div>
               </div>

                      <div className="border-t pt-6 space-y-4">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Salary & Allowances</h4>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <Label>House Rent Allowance</Label>
                               <NumberInput {...employeeForm.register('houseRentAllowance', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                               <Label>Transport Allowance</Label>
                               <NumberInput {...employeeForm.register('transportAllowance', { valueAsNumber: true })} />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <Label>Medical Allowance</Label>
                               <NumberInput {...employeeForm.register('medicalAllowance', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                               <Label>Dearness Allowance</Label>
                               <NumberInput {...employeeForm.register('dearnesAllowance', { valueAsNumber: true })} />
                            </div>
                         </div>
                         <p className="text-sm font-semibold">Gross: NPR {grossSalary.toFixed(2)}</p>
                      </div>

                      <div className="border-t pt-6 space-y-4">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deductions</h4>
                         <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                               <Label>PF Deduction %</Label>
                               <NumberInput {...employeeForm.register('pfDeductionPercent', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                               <Label>SSF %</Label>
                               <NumberInput {...employeeForm.register('ssfDeductionPercent', { valueAsNumber: true })} />
                            </div>
                            <div className="flex items-center gap-2 pt-8">
                               <input type="checkbox" checked={employeeForm.watch('isTdsApplicable')} onChange={(e) => employeeForm.setValue('isTdsApplicable', e.target.checked)} />
                               <Label>TDS Applicable</Label>
                            </div>
                         </div>
                         <div className="bg-muted/30 rounded-md p-3 mt-3">
                            <p className="text-sm font-semibold mb-2">Payroll Summary</p>
                            <div className="space-y-1 text-sm">
                               <div className="flex justify-between"><span className="text-muted-foreground">Gross Salary:</span><span>NPR {grossSalary.toFixed(2)}</span></div>
                               <div className="flex justify-between text-red-500"><span>Total Deductions:</span><span>- NPR {totalDeductions.toFixed(2)}</span></div>
                               <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Net Salary:</span><span>NPR {netSalary.toFixed(2)}</span></div>
                            </div>
                         </div>
                      </div>

               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEmployeeOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Save Employee
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Resolve Request</DialogTitle>
               <DialogDescription>Respond to the employee's assistance request.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               {selectedRequest && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                     <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{selectedRequest.category} - {selectedRequest.subject}</p>
                     <p className="text-sm italic">"{selectedRequest.message}"</p>
                  </div>
               )}
               <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={resolution.status} onValueChange={(v) => setResolution({ ...resolution, status: v })}>
                     <SelectTrigger>
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="InProgress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <Label>Response Message</Label>
                  <textarea 
                     className="w-full min-h-[100px] p-3 text-sm border rounded-md focus:ring-2 focus:ring-primary"
                     placeholder="Type your response here..."
                     value={resolution.response}
                     onChange={(e) => setResolution({ ...resolution, response: e.target.value })}
                  />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setIsResolveOpen(false)}>Cancel</Button>
               <Button onClick={async () => {
                  if (!selectedRequest) return;
                  await hrApi.resolveAssistanceRequest(selectedRequest.id, resolution);
                  toast.success('Request updated');
                  setIsResolveOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['assistance-requests'] });
               }}>Update Request</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
