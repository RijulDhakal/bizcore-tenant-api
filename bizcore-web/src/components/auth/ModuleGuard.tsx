import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissionStore } from '../../store/usePermissionStore';
import { useAuthStore } from '../../store/useAuthStore';

interface ModuleGuardProps {
  moduleCode: string;
  children: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({ moduleCode, children }) => {
  const { isModuleEnabled, isLoaded, isLoading } = usePermissionStore();
  const { accessToken, hasHydrated, isBootstrapped } = useAuthStore();

  if (!hasHydrated || !accessToken || !isBootstrapped || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Checking system configuration...</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    console.warn('[ModuleGuard] Permissions not loaded yet. Allowing route as fallback.');
    return <>{children}</>;
  }

  if (!isModuleEnabled(moduleCode)) {
    console.warn(`[ModuleGuard] Access denied to module: ${moduleCode}. Redirecting to dashboard.`);
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
