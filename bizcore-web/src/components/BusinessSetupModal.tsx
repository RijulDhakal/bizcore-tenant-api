import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Loader2,
  Globe,
  FileText,
  Hash,
  ChevronRight,
  ChevronLeft,
  Check,
  Box,
  ShieldCheck
} from 'lucide-react';
import { businessApi } from '../api/api';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const step2Schema = z.object({
  panNumber: z.string().optional().or(z.literal('')),
  isVATRegistered: z.boolean(),
  vatNumber: z.string().optional().or(z.literal('')),
  currency: z.string(),
  fiscalYearStart: z.string(),
  website: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.isVATRegistered && (!data.vatNumber || data.vatNumber.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "VAT Number is required if VAT registered",
  path: ["vatNumber"],
});

type Step2Form = z.infer<typeof step2Schema>;

interface BusinessSetupModalProps {
  onComplete: (tenantId: string) => void;
  isEdit?: boolean;
  initialData?: any;
}

export const BusinessSetupModal: React.FC<BusinessSetupModalProps> = ({ onComplete, isEdit, initialData }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { setTokens } = useAuthStore();
  const queryClient = useQueryClient();

  const form2 = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: initialData ? {
      panNumber: initialData.panNumber || '',
      isVATRegistered: initialData.isVATRegistered || false,
      vatNumber: initialData.vatNumber || '',
      currency: initialData.currency || 'NPR',
      fiscalYearStart: initialData.fiscalYearStart || 'Shrawan',
      website: initialData.website || '',
      description: initialData.description || ''
    } : {
      isVATRegistered: false,
      currency: 'NPR',
      fiscalYearStart: 'Shrawan',
      panNumber: '',
      vatNumber: '',
      website: '',
      description: ''
    }
  });


  const handleStep2Submit = form2.handleSubmit(async (data) => {
    const payload = {
      ...initialData,
      ...data
    };

    setLoading(true);
    try {
      let response;
      if (isEdit) {
        response = await businessApi.update(payload);
        toast.success('Business settings updated!');
        queryClient.invalidateQueries({ queryKey: ['my-business'] });
      } else {
        response = await businessApi.create(payload);
        toast.success('🎉 Business created! Welcome to BizCore.');
      }

      const result = response.data.data;

      if (!isEdit && result?.accessToken) {
        setTokens(result.accessToken, result.refreshToken);
      }

      const business = isEdit ? result : result?.business;
      onComplete(business?.tenantId || business?.id || '');
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} business`);
    } finally {
      setLoading(false);
    }
  });

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.95)',
          backdropFilter: 'blur(12px)'
        }}
        onClick={() => isEdit && onComplete('')}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
        className="animate-in fade-in zoom-in duration-300"
      >
        <div className="h-1 bg-border/20 overflow-hidden">
          <div
            className="h-full bg-[#4F6EF7] transition-all duration-300 ease-out"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="text-center mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-accent px-3 py-1 rounded-full border border-border">
              Step {step} of 2
            </span>
            <h2 className="text-2xl font-bold text-foreground mt-4 tracking-tight">
              {step === 1 ? "Verify Your Profile" : "Regional Preferences"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 1 ? "Confirm details registered by your administrator" : "Configure your local currency and fiscal settings"}
            </p>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Building2 size={12} className="text-indigo-500" /> Legal Business Name
                  </p>
                  <p className="text-sm font-bold text-foreground">{initialData?.name || 'Dhunga Store'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Hash size={12} className="text-indigo-500" /> PAN Number
                    </p>
                    <p className="text-sm font-bold text-foreground">{initialData?.panNumber || '123456789'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                      <ShieldCheck size={12} className="text-indigo-500" /> VAT Status
                    </p>
                    <p className="text-sm font-bold text-foreground">{initialData?.isVATRegistered ? `Registered (${initialData.vatNumber})` : 'Not Registered'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Business Location</p>
                  <p className="text-sm font-bold text-foreground">
                    {initialData?.address}
                    {initialData?.city && `, ${initialData.city}`}
                    {initialData?.district && `, ${initialData.district}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-100/50 text-amber-700">
                <div className="mt-0.5"><Box size={16} /></div>
                <div className="text-[10px] font-medium leading-relaxed uppercase tracking-wider">
                  <span className="font-black">Legal Info is Locked</span><br />
                  Corporate details are managed by SuperAdmin. Contact support for legal name or PAN/VAT updates.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F6EF7] px-4 py-4 font-black text-white transition-all hover:bg-[#3B5BDB] active:scale-[0.98] shadow-lg shadow-[#4F6EF7]/20 text-[11px] uppercase tracking-widest"
              >
                Setup Regional Preferences <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 ml-1">Currency</label>
                    <select
                      {...form2.register('currency')}
                      className="input-field w-full px-4 py-3.5 text-sm"
                    >
                      <option value="NPR">NPR (Nepali Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="INR">INR (Indian Rupee)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 ml-1">Fiscal Year Start</label>
                    <select
                      {...form2.register('fiscalYearStart')}
                      className="input-field w-full px-4 py-3.5 text-sm"
                    >
                      <option value="Shrawan">Shrawan (July)</option>
                      <option value="January">January</option>
                      <option value="April">April</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 ml-1">Website (Optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-3.5 text-muted-foreground" size={18} />
                    <input
                      {...form2.register('website')}
                      className="input-field w-full pl-12 pr-4 py-3.5 text-sm"
                      placeholder="https://yourbusiness.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 ml-1">Business Description</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-3.5 text-muted-foreground" size={18} />
                    <textarea
                      {...form2.register('description')}
                      rows={3}
                      className="input-field w-full pl-12 pr-4 py-3 text-sm resize-none"
                      placeholder="What does your business do?"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F6EF7] to-[#3B5BDB] px-4 py-4 font-black text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-[#4F6EF7]/20 text-[11px] uppercase tracking-widest"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>{isEdit ? <Check size={18} /> : <ChevronRight size={18} />} {isEdit ? 'Save & Finish' : 'Complete Setup'}</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
