import { useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_PERMISSIONS } from '../config/rolePermissions';
import type { Permission } from '../config/rolePermissions';

export const usePermission = () => {
  const { user } = useAuthStore();

  const hasPermission = useCallback((permission: Permission | '*') => {
    if (!user) return false;

    // Owner and SuperAdmin have full access
    if (user.role === 0 || user.role === 5) return true;

    const allowed = ROLE_PERMISSIONS[user.role] || [];
    
    // Check if user has global permission
    if (allowed.includes('*' as any)) return true;

    return allowed.includes(permission as Permission);
  }, [user]);

  return { hasPermission, role: user?.role };
};
