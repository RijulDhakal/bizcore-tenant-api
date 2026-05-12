import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { contactApi } from '../api/api';
import { Users, Plus, Search, Mail, Phone, MapPin, Trash2, Edit2, Loader2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Skeleton } from '../components/ui/skeleton';
import { validatePAN, validatePhone } from '../utils/nepali';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  landlinePhone: z.string().optional(),
  businessName: z.string().optional(),
  panNumber: z.string().optional(),
  customerGroup: z.string().optional(),
  creditLimit: z.number().default(0),
  creditDays: z.number().default(30),
  openingBalance: z.number().default(0),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  type: z.enum(['Customer', 'Supplier']),
  notes: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export const Contacts = () => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', search, type],
    queryFn: () => contactApi.getAll({ search, type: type === 'all' ? '' : type }),
  });

  const contacts = contactsData?.data?.data || [];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: 'Customer',
    }
  });



  const handleOpenForm = (contact?: any) => {
    if (contact) {
      setSelectedContact(contact);
      const [firstName, ...lastNameParts] = contact.name.split(' ');
      setValue('firstName', firstName);
      setValue('lastName', lastNameParts.join(' '));
      setValue('phone', contact.phone || '');
      setValue('landlinePhone', contact.landlinePhone || '');
      setValue('businessName', contact.businessName || '');
      setValue('panNumber', contact.panNumber || '');
      setValue('customerGroup', contact.customerGroup || 'Regular');
      setValue('creditLimit', Number(contact.creditLimit || 0));
      setValue('creditDays', Number(contact.creditDays || 30));
      setValue('openingBalance', Number(contact.openingBalance || 0));
      setValue('email', contact.email || '');
      setValue('address', contact.address || '');
      setValue('type', contact.type);
      setValue('notes', contact.notes || '');
    } else {
      setSelectedContact(null);
      reset({
        firstName: '',
        lastName: '',
        phone: '',
        landlinePhone: '',
        businessName: '',
        panNumber: '',
        customerGroup: 'Regular',
        creditLimit: 0,
        creditDays: 30,
        openingBalance: 0,
        email: '',
        address: '',
        type: 'Customer',
        notes: '',
      });
    }
    setIsFormOpen(true);
  };

  const onSubmit = async (values: ContactFormValues) => {
    try {
      if (!validatePhone(values.phone)) {
        toast.error('Enter a valid Nepal mobile number (98xxxxxxxx or 97xxxxxxxx).');
        return;
      }
      if (values.panNumber && !validatePAN(values.panNumber)) {
        toast.error('PAN number must be exactly 9 digits.');
        return;
      }

      setIsSubmitting(true);
      const payload = {
        name: `${values.firstName} ${values.lastName}`,
        businessName: values.businessName || null,
        panNumber: values.panNumber || null,
        phone: values.phone,
        landlinePhone: values.landlinePhone || null,
        email: values.email || null,
        address: values.address || null,
        creditLimit: values.creditLimit || 0,
        creditDays: values.creditDays || 30,
        customerGroup: values.customerGroup || null,
        openingBalance: values.openingBalance || 0,
        type: values.type === 'Customer' ? 0 : 1,
        notes: values.notes || null,
      };

      if (selectedContact) {
        await contactApi.update(selectedContact.id, payload);
        toast.success('Contact updated');
      } else {
        await contactApi.create(payload);
        toast.success('Contact added');
      }

      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (contact: any) => {
    if (!confirm(`Are you sure you want to delete ${contact.name}?`)) return;
    try {
      await contactApi.delete(contact.id);
      toast.success('Contact deleted');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error: any) {
      toast.error('Failed to delete contact');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-sm">Manage your business network of customers and suppliers.</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            className="pl-10" 
            placeholder="Search by name, email or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={type} onValueChange={setType}>
          <TabsList>
            <TabsTrigger value="all">All Contacts</TabsTrigger>
            <TabsTrigger value="Customer">Customers</TabsTrigger>
            <TabsTrigger value="Supplier">Suppliers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
             <Card key={i} className="p-6">
                <div className="flex items-center gap-4 mb-4">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                   </div>
                </div>
                <div className="space-y-2 pt-4 border-t">
                   <Skeleton className="h-3 w-full" />
                   <Skeleton className="h-3 w-2/3" />
                </div>
             </Card>
          ))
        ) : contacts.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
             <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
             <h3 className="mt-4 text-lg font-semibold">No contacts found</h3>
             <p className="text-muted-foreground text-sm">No records match your search criteria.</p>
          </div>
        ) : (
          contacts.map((contact: any) => (
            <Card key={contact.id} className="group relative">
               <div className="absolute top-4 right-4">
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                           <MoreHorizontal size={16} />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenForm(contact)}>
                           <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(contact)}>
                           <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
               <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                     <Avatar className="h-12 w-12 border">
                        <AvatarFallback className="bg-primary/5 text-primary text-base font-bold">
                           {contact.name.charAt(0)}
                        </AvatarFallback>
                     </Avatar>
                     <div>
                        <h3 className="font-bold truncate max-w-[150px]">{contact.name}</h3>
                        <Badge variant="secondary" className={contact.type === 'Customer' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}>
                           {contact.type}
                        </Badge>
                     </div>
                  </div>
                  <div className="space-y-3 text-sm">
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone size={14} />
                        <span>{contact.phone || 'No phone'}</span>
                     </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} />
                        <span className="truncate">{contact.email || 'No email'}</span>
                     </div>
                     <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{contact.address || 'No address added'}</span>
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
             <DialogTitle>{selectedContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>First Name *</Label>
                   <Input {...register('firstName')} placeholder="John" />
                   {errors.firstName && <p className="text-destructive text-xs">{String(errors.firstName.message)}</p>}
                </div>
                <div className="space-y-2">
                   <Label>Last Name *</Label>
                   <Input {...register('lastName')} placeholder="Doe" />
                   {errors.lastName && <p className="text-destructive text-xs">{String(errors.lastName.message)}</p>}
                </div>
             </div>
             <div className="space-y-2">
                <Label>Phone *</Label>
                <div className="relative">
                   <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <Input {...register('phone')} className="pl-9" placeholder="+977 98..." />
                </div>
                {errors.phone && <p className="text-destructive text-xs">{String(errors.phone.message)}</p>}
             </div>
               <div className="space-y-2">
                 <Label>Landline Phone</Label>
                 <Input {...register('landlinePhone')} placeholder="01-XXXXXXX" />
               </div>
               <div className="space-y-2">
                 <Label>Business Name</Label>
                 <Input {...register('businessName')} placeholder="Company or shop name" />
               </div>
               <div className="space-y-2">
                 <Label>PAN Number</Label>
                 <Input {...register('panNumber')} placeholder="9-digit PAN number" maxLength={9} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Customer Group</Label>
                   <Input {...register('customerGroup')} placeholder="Regular / Retail / Wholesale / VIP" />
                 </div>
                 <div className="space-y-2">
                   <Label>Opening Balance</Label>
                   <Input type="number" step="0.01" {...register('openingBalance', { valueAsNumber: true })} placeholder="0" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Credit Limit</Label>
                   <Input type="number" step="0.01" {...register('creditLimit', { valueAsNumber: true })} placeholder="0" />
                 </div>
                 <div className="space-y-2">
                   <Label>Credit Days</Label>
                   <Input type="number" {...register('creditDays', { valueAsNumber: true })} placeholder="30" />
                 </div>
               </div>
             <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                   <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <Input {...register('email')} className="pl-9" placeholder="john@example.com" />
                </div>
             </div>
             <div className="space-y-2">
                <Label>Type</Label>
                <Tabs value={watch('type')} onValueChange={(v) => setValue('type', v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="Customer" className="flex-1">Customer</TabsTrigger>
                    <TabsTrigger value="Supplier" className="flex-1">Supplier</TabsTrigger>
                  </TabsList>
                </Tabs>
             </div>
             <div className="space-y-2">
                <Label>Address</Label>
                <Textarea {...register('address')} placeholder="Full address..." />
             </div>
             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {selectedContact ? 'Update Contact' : 'Save Contact'}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};


