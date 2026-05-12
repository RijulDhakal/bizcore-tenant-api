import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab: 'merchants' | 'delivery';
}

export function AddPartnerModal({ isOpen, onClose, defaultTab }: AddPartnerModalProps) {
  const [partnerType, setPartnerType] = useState<'merchants' | 'delivery'>(defaultTab);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // System Flow: UI -> API
      const endpoint = partnerType === 'merchants' ? '/merchants' : '/delivery-partners';
      
      const payload = partnerType === 'merchants' 
        ? {
            name: data.name,
            contactPerson: data.contactPerson,
            phone: data.phone,
            email: data.email,
            address: data.address,
            defaultCommissionRate: Number(data.defaultCommissionRate) || 0,
            notes: data.notes
          }
        : {
            name: data.name,
            type: data.type || 'In-House',
            contactPhone: data.contactPhone,
            defaultDeliveryFee: Number(data.defaultDeliveryFee) || 0
          };

      const response = await api.post(endpoint, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success(`${partnerType === 'merchants' ? 'Merchant' : 'Delivery Partner'} added successfully!`);
      queryClient.invalidateQueries({ queryKey: [partnerType === 'merchants' ? 'merchants' : 'delivery-partners'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add partner. Please verify details.');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Partner</DialogTitle>
        </DialogHeader>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${partnerType === 'merchants' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setPartnerType('merchants')}
          >
            Merchant
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${partnerType === 'delivery' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setPartnerType('delivery')}
          >
            Delivery
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Business Name</Label>
            <Input {...register('name', { required: true })} placeholder="e.g., Express Logistics" className="rounded-xl bg-slate-50" />
          </div>

          {partnerType === 'merchants' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Contact Person</Label>
                  <Input {...register('contactPerson')} placeholder="John Doe" className="rounded-xl bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone</Label>
                  <Input {...register('phone')} placeholder="9812345678" className="rounded-xl bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email</Label>
                  <Input type="email" {...register('email')} placeholder="hello@company.com" className="rounded-xl bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Commission %</Label>
                  <Input type="number" step="0.1" {...register('defaultCommissionRate')} placeholder="0.0" className="rounded-xl bg-slate-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Address</Label>
                <Input {...register('address')} placeholder="City, Location" className="rounded-xl bg-slate-50" />
              </div>
            </>
          ) : (
             <>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Partner Type</Label>
                  <select {...register('type')} className="w-full h-10 px-3 bg-slate-50 border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                    <option value="In-House">In-House Staff</option>
                    <option value="Third-Party">Third-Party Logistics</option>
                    <option value="Freelance">Freelance Rider</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Contact Phone</Label>
                  <Input {...register('contactPhone')} placeholder="9812345678" className="rounded-xl bg-slate-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Default Delivery Fee (NPR)</Label>
                <Input type="number" {...register('defaultDeliveryFee')} placeholder="100" className="rounded-xl bg-slate-50" />
              </div>
             </>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold px-8">
              {isSubmitting ? 'Saving...' : 'Save Partner'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
