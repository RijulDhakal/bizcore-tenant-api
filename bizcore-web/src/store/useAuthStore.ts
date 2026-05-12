import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { usePermissionStore } from './usePermissionStore';

// Auto-clear corrupted state on load.
try {
  const stored = localStorage.getItem('bizcore-auth');
  if (stored) {
    const parsed = JSON.parse(stored);
    const state = parsed?.state;
    if (state?.isAuthenticated && !state?.accessToken) {
      console.log('[Store] Clearing corrupted auth state');
      localStorage.removeItem('bizcore-auth');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }
} catch {
  localStorage.removeItem('bizcore-auth');
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: number;
  currentTenantId: string | null;
  isFirstLogin: boolean;
}

interface Business {
  id: string;
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  businessType?: string;
  panNumber?: string | null;
  isVATRegistered?: boolean;
  vatNumber?: string | null;
  currency?: string;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  onboardingStatus?: string | null;
}

interface ModuleInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  isEnabled: boolean;
}

interface AuthState {
  user: User | null;
  business: Business | null;
  businessName: string;
  businessId: string | null;
  modules: ModuleInfo[];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  isBootstrapped: boolean;
  bootstrapError: string | null;
  initAuth: () => Promise<void>;
  bootstrap: () => Promise<void>;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isSuperAdmin: () => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isAccountant: () => boolean;
  isSales: () => boolean;
  isPOSOperator: () => boolean;
  isHR: () => boolean;
  isStaff: () => boolean;
  isManagement: () => boolean;
}

const ROLE_MAP: Record<string, number> = {
  'SuperAdmin': 0,
  'Admin': 1,
  'Accountant': 2,
  'Sales': 3,
  'POSOperator': 4,
  'HRManager': 6,
  'Owner': 5,
};

const NORMALIZED_ROLE_MAP: Record<string, number> = {
  superadmin: 0,
  super_admin: 0,
  'super admin': 0,
  admin: 1,
  accountant: 2,
  sales: 3,
  posoperator: 4,
  'pos operator': 4,
  hrmanager: 6,
  'hr manager': 6,
  owner: 5,
};

const isValidRole = (role: number): role is 0 | 1 | 2 | 3 | 4 | 5 | 6 => [0, 1, 2, 3, 4, 5, 6].includes(role);

const parseRole = (raw: any): number => {
  if (raw === null || raw === undefined) return -1;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const parsed = parseRole(item);
      if (isValidRole(parsed)) return parsed;
    }
    return -1;
  }
  const num = Number(raw);
  if (!isNaN(num) && isValidRole(num)) return num;
  if (typeof raw === 'string') {
    const normalized = raw.trim();
    const mapped = ROLE_MAP[normalized] ?? NORMALIZED_ROLE_MAP[normalized.toLowerCase()];
    return mapped ?? -1;
  }
  return -1;
};

const base64UrlDecode = (str: string) => {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    return JSON.parse(atob(padded));
  } catch (e) {
    console.error('[Auth] Decoding failed:', e);
    return null;
  }
};

const decodeToken = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = base64UrlDecode(parts[1]);
    if (!decoded) return null;
    const roleClaim = decoded.role ?? decoded.Role ?? decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return {
      id: decoded.uid,
      email: decoded.email,
      role: parseRole(roleClaim),
      tenantId: decoded.tid,
    };
  } catch {
    return null;
  }
};

const DEFAULT_ENABLED_MODULES = [
  'dashboard', 'pos', 'invoices', 'inventory', 'purchase',
  'expenses', 'khata', 'reports', 'hr', 'projects', 'settings',
];

const authHttp = axios.create({
  baseURL: 'http://localhost:5107/api/tenant',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

let bootstrapInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      business: null,
      businessName: '',
      businessId: null,
      modules: [],
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      isBootstrapped: false,
      bootstrapError: null,
      initAuth: async () => {
        const state = get();
        if (state.isBootstrapped) return;
        if (!state.isAuthenticated || !state.accessToken) {
          set({ isBootstrapped: true });
          return;
        }
        await get().bootstrap();
      },
      bootstrap: async () => {
        const state = get();
        if (state.isBootstrapped) return;
        if (bootstrapInFlight) return bootstrapInFlight;

        bootstrapInFlight = (async () => {
          const timeoutId = setTimeout(() => {
            set({ isBootstrapped: true, bootstrapError: null });
          }, 8000);

          try {
            if (!state.accessToken) {
              set({ isBootstrapped: true });
              return;
            }

            try {
              const decoded = decodeToken(state.accessToken);
              if (!decoded) throw new Error('Token decode failed');

              const roleLabel = String(decoded.role ?? state.user?.role ?? '');
              usePermissionStore.getState().setBootstrapData({
                role: roleLabel,
                permissions: [],
                enabledModules: DEFAULT_ENABLED_MODULES,
                modules: [],
              });
            } catch (err) {
              get().logout();
              return;
            }

            try {
              const response = await authHttp.get('/business/me', {
                timeout: 5000,
                headers: { Authorization: `Bearer ${state.accessToken}` },
              });
              const business = response.data?.data ?? response.data;
              if (business) {
                set({
                  business,
                  businessName: business.name ?? '',
                  businessId: business.id ?? null,
                });
              }
            } catch (err) {
              console.log('[Bootstrap] Business fetch failed');
            }

            set({ isBootstrapped: true, bootstrapError: null });
          } finally {
            clearTimeout(timeoutId);
            set({ isBootstrapped: true });
          }
        })().finally(() => {
          bootstrapInFlight = null;
        }) as Promise<void>;

        return bootstrapInFlight;
      },
      setAuth: (user, accessToken, refreshToken) => {
        const decoded = decodeToken(accessToken);
        const role = parseRole(decoded?.role ?? user.role);
        if (!isValidRole(role)) {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return;
        }
        set({
          user: { ...user, role },
          business: null,
          modules: [],
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isBootstrapped: false,
          bootstrapError: null,
        });
      },
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken: refreshToken || get().refreshToken });
      },
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('bizcore-auth');
        localStorage.removeItem('loginRedirect');
        sessionStorage.clear();
        usePermissionStore.getState().reset();
        set({
          user: null,
          business: null,
          businessName: '',
          businessId: null,
          modules: [],
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isBootstrapped: false,
          bootstrapError: null,
        });
      },
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      isSuperAdmin: () => get().user?.role === 0,
      isOwner: () => get().user?.role === 5,
      isAdmin: () => {
        const role = get().user?.role;
        return role === 1 || role === 5;
      },
      isAccountant: () => get().user?.role === 2,
      isSales: () => get().user?.role === 3,
      isPOSOperator: () => get().user?.role === 4,
      isHR: () => {
        const role = get().user?.role;
        return role === 6 || role === 5;
      },
      isStaff: () => {
        const role = get().user?.role;
        return role !== undefined && role !== null && isValidRole(role) && role !== 0;
      },
      isManagement: () => {
        const role = get().user?.role;
        return [0, 1, 5, 6].includes(role ?? -1);
      },
    }),
    {
      name: 'bizcore-auth',
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        businessName: state.businessName,
        businessId: state.businessId,
        modules: state.modules,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

const handlePostHydration = () => {
  const state = useAuthStore.getState();
  if (state.isAuthenticated && (!state.accessToken || !state.user)) {
    useAuthStore.setState({
      user: null, business: null, businessName: '', businessId: null, modules: [],
      accessToken: null, refreshToken: null, isAuthenticated: false, isBootstrapped: false,
      bootstrapError: null, hasHydrated: true,
    });
    return;
  }
  
  if (state.isAuthenticated && state.accessToken) {
    useAuthStore.setState({ isBootstrapped: false, hasHydrated: true });
  } else {
    useAuthStore.setState({ hasHydrated: true, isBootstrapped: true });
  }
};

if (useAuthStore.persist?.onFinishHydration) {
  useAuthStore.persist.onFinishHydration(handlePostHydration);
} else {
  handlePostHydration();
}

// Failsafe: if hydration never completes, force it after 3 seconds
setTimeout(() => {
  const state = useAuthStore.getState();
  if (!state.hasHydrated) {
    console.warn('[Auth] Hydration failsafe triggered — forcing hasHydrated=true');
    useAuthStore.setState({ hasHydrated: true, isBootstrapped: true });
  }
}, 3000);
