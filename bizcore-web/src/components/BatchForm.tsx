import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { NumberInput } from './ui/number-input';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const batchFormSchema = z.object({
  batchNumber: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  manufactureDate: z.string().optional(),
  initialQuantity: z.number().min(1, 'Quantity must be greater than 0'),
  unitCost: z.number().optional(),
  location: z.string().optional(),
  warehouseId: z.string().min(1, 'Warehouse is required'),
});

type BatchFormData = z.infer<typeof batchFormSchema>;

interface BatchFormProps {
  batch?: BatchFormData & { id?: string } | null;
  onSave: (batch: BatchFormData & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  warehouses: any[];
}

export function BatchForm({ batch, onSave, onCancel, isSubmitting, warehouses }: BatchFormProps) {
  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: batch || {
      batchNumber: '',
      expiryDate: '',
      manufactureDate: '',
      initialQuantity: 0,
      warehouseId: warehouses.find(w => w.isDefault)?.id || warehouses[0]?.id || '',
    },
  });

  const onSubmit = (data: BatchFormData) => {
    onSave({
      ...data,
      id: batch?.id,
    });
    if (!batch?.id) {
      form.reset({
        batchNumber: '',
        expiryDate: '',
        manufactureDate: '',
        initialQuantity: 0,
        warehouseId: data.warehouseId, // Keep the same warehouse for convenience
        unitCost: data.unitCost, // Keep unit cost? Maybe
        location: ''
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/50 rounded-lg border border-slate-200 shadow-inner">
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Warehouse *</Label>
        <Select 
          value={form.watch('warehouseId')} 
          onValueChange={(v) => form.setValue('warehouseId', v)}
        >
          <SelectTrigger className="h-9 rounded-md bg-white">
            <SelectValue placeholder="Select Warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map(w => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.warehouseId && (
          <p className="text-[10px] text-destructive font-medium">{form.formState.errors.warehouseId.message}</p>
        )}
      </div>

      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Batch Number</Label>
        <Input {...form.register('batchNumber')} placeholder="Auto-generated if empty" className="h-9 rounded-md bg-white" />
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Manufacture Date</Label>
        <Input type="date" {...form.register('manufactureDate')} className="h-9 rounded-md bg-white" />
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Expiry Date *</Label>
        <Input type="date" {...form.register('expiryDate')} className="h-9 rounded-md bg-white" />
        {form.formState.errors.expiryDate && (
          <p className="text-[10px] text-destructive font-medium">{form.formState.errors.expiryDate.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Initial Quantity *</Label>
        <NumberInput
          {...form.register('initialQuantity', { valueAsNumber: true })}
          className="h-9 rounded-md bg-white"
        />
        {form.formState.errors.initialQuantity && (
          <p className="text-[10px] text-destructive font-medium">{form.formState.errors.initialQuantity.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit Cost</Label>
        <NumberInput
          {...form.register('unitCost', { valueAsNumber: true })}
          step="0.01"
          className="h-9 rounded-md bg-white"
        />
      </div>

      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Storage Location</Label>
        <Input {...form.register('location')} placeholder="e.g. Shelf A-1, Bin 4" className="h-9 rounded-md bg-white" />
      </div>

      <div className="col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-9 font-bold text-xs uppercase tracking-widest text-slate-400">
          Cancel
        </Button>
        <Button 
          type="button" 
          disabled={isSubmitting} 
          onClick={form.handleSubmit(onSubmit)}
          className="h-9 font-black text-xs uppercase tracking-widest px-6 rounded-md"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {batch?.id ? 'Update Batch' : 'Add Batch'}
        </Button>
      </div>
    </div>
  );
}

export type { BatchFormData };
