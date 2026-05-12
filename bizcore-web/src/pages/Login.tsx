import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/api';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  tenantSlug: z.string().min(1, 'Tenant is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const isValidRole = (role: number): role is 1 | 2 | 3 | 4 | 5 | 6 => [1, 2, 3, 4, 5, 6].includes(role);

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const logout = useAuthStore((state) => state.logout);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const resolveRole = (raw: any): number => {
    if (raw === null || raw === undefined) return -1;

    if (Array.isArray(raw)) {
      for (const item of raw) {
        const parsed = resolveRole(item);
        if (isValidRole(parsed)) {
          return parsed;
        }
      }
      return -1;
    }

    const num = Number(raw);
    if (!isNaN(num) && isValidRole(num)) return num;
    const map: Record<string, number> = {
      'Admin': 1, 'Accountant': 2, 'Sales': 3, 'POSOperator': 4, 'Owner': 5, 'HRManager': 6,
      'admin': 1, 'accountant': 2, 'sales': 3, 'posoperator': 4, 'pos operator': 4, 'owner': 5, 'hrmanager': 6, 'hr manager': 6,
    };
    if (typeof raw === 'string') {
      const normalized = raw.trim();
      return map[normalized] ?? map[normalized.toLowerCase()] ?? -1;
    }
    return -1;
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(data);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);

      try {
        await bootstrap();
      } catch {
        logout();
        setError('Unable to initialize your workspace. Please sign in again.');
        return;
      }
      
      const role = resolveRole(user?.role);
      if (!isValidRole(role)) {
        logout();
        setError('This account cannot access the tenant app. Please use the correct portal or contact support.');
        return;
      }

      if (user?.isFirstLogin) {
        navigate('/change-password', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F6EF7] to-[#3B5BDB] font-bold text-white shadow-lg shadow-primary-900/20">
            <LogIn size={32} />
          </div>
          <h2 className="mt-8 text-3xl font-bold tracking-tight text-[var(--text-primary)]">Welcome back</h2>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Log in to your account
          </p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20 animate-in shake duration-300">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 ml-1">Tenant</label>
              <input
                {...register('tenantSlug')}
                className="input-field w-full text-sm"
                placeholder="your-tenant-slug"
                autoCapitalize="none"
                autoCorrect="off"
              />
              {errors.tenantSlug && <p className="mt-1.5 text-xs text-red-500 ml-1 font-medium">{errors.tenantSlug.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 ml-1">Email address</label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-[var(--text-muted)]">
                  <Mail size={18} />
                </div>
                <input
                  {...register('email')}
                  className="input-field w-full pl-12 text-sm"
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-500 ml-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-[var(--text-muted)]">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="input-field w-full pl-12 text-sm"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500 ml-1 font-medium">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4F6EF7] hover:bg-[#3B5BDB] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#4F6EF7]/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              'Sign in'
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-[var(--text-muted)]">
              Contact your system administrator to create an account.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
