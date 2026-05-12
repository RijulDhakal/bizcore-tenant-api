import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi, type ChangePasswordRequest } from '../api/api';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export const ChangePassword = () => {
  const navigate = useNavigate();
  const { updateUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const getApiErrorMessage = (err: any) => {
    const data = err?.response?.data;
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors[0];
    }

    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }

    return 'Failed to update password';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!/[a-z]/.test(form.newPassword)) {
      toast.error('Password must include at least one lowercase letter');
      return;
    }

    if (!/\d/.test(form.newPassword)) {
      toast.error('Password must include at least one number');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.changePassword(form);
      if (res.data.success) {
        toast.success("Password updated successfully!");
        updateUser({ isFirstLogin: false });
        // Redirect to their correct path
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 p-8 border border-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck size={120} className="text-indigo-600" />
          </div>

          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
              <Lock size={28} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 underline decoration-indigo-200 decoration-4 underline-offset-8">
              Update Password
            </h1>
            <p className="text-slate-500 font-medium mb-8 text-sm">
              Since this is your first time logging in, you must set a new secure password for your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Current Password</label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-indigo-600 transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={form.currentPassword}
                    onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                    className="block w-full pl-11 pr-11 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-0 transition-all font-medium text-slate-900 placeholder:text-slate-300"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">New Password</label>
                  <div className="relative group/field">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-indigo-600 transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showNew ? "text" : "password"}
                      required
                      value={form.newPassword}
                      onChange={e => setForm({ ...form, newPassword: e.target.value })}
                      className="block w-full pl-11 pr-11 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-0 transition-all font-medium text-slate-900 placeholder:text-slate-300"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Confirm New Password</label>
                  <div className="relative group/field">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-indigo-600 transition-colors">
                      <CheckCircle2 size={16} />
                    </div>
                    <input
                      type="password"
                      required
                      value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      className="block w-full pl-11 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-0 transition-all font-medium text-slate-900 placeholder:text-slate-300"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  type="button"
                  onClick={logout}
                  className="py-4 px-6 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Sign Out
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-4 px-6 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Update Securely
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Powered by BizCore Secure Onboarding
        </p>
      </div>
    </div>
  );
};
