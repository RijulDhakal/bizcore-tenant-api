import { create } from 'zustand';

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

interface PermissionState {
  role: string;
  permissions: string[];
  enabledModules: string[];
  modules: ModuleInfo[];
  isLoaded: boolean;
  isLoading: boolean;

  setBootstrapData: (data: {
    role: string;
    permissions: string[];
    enabledModules: string[];
    modules: ModuleInfo[];
  }) => void;
  fetchPermissions: () => Promise<void>;
  fetchModules: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  isModuleEnabled: (code: string) => boolean;
  canAccess: (moduleCode: string, permissionCode?: string) => boolean;
  reset: () => void;
}

export const usePermissionStore = create<PermissionState>()((set, get) => ({
  role: '',
  permissions: [],
  enabledModules: [],
  modules: [],
  isLoaded: false,
  isLoading: false,

  setBootstrapData: ({ role, permissions, enabledModules, modules }) => {
    set({
      role: role || '',
      permissions: permissions || [],
      enabledModules: enabledModules || [],
      modules: modules || [],
      isLoaded: true,
      isLoading: false,
    });
  },

  fetchPermissions: async () => {
    const current = get();
    if (current.isLoaded) return;
    set({ isLoading: false, isLoaded: true });
  },

  fetchModules: async () => {
    return;
  },

  hasPermission: (code: string) => {
    const { role, permissions } = get();
    // Owner and SuperAdmin have full access
    if (role === 'Owner' || role === 'SuperAdmin') return true;
    return permissions.includes(code);
  },

  isModuleEnabled: (code: string) => {
    const { role, enabledModules } = get();
    // Owner and SuperAdmin see everything in their management context
    if (role === 'SuperAdmin' || role === 'Owner') return true;
    return enabledModules.includes(code);
  },

  canAccess: (moduleCode: string, permissionCode?: string) => {
    const { isModuleEnabled, hasPermission } = get();
    if (!isModuleEnabled(moduleCode)) return false;
    if (permissionCode && !hasPermission(permissionCode)) return false;
    return true;
  },

  reset: () => {
    set({
      role: '',
      permissions: [],
      enabledModules: [],
      modules: [],
      isLoaded: false,
      isLoading: false,
    });
  },
}));
