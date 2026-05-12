import axiosInstance from './axiosInstance';
import { fetchOnce } from '../utils/fetchOnce';

// Module API
export const moduleApi = {
  getAll: () => axiosInstance.get('/modules'),
  getTenantModules: () => axiosInstance.get('/modules/tenant'),
  getTenantModulesById: (tenantId: string) => axiosInstance.get(`/modules/tenant/${tenantId}`),
  enable: (code: string) => axiosInstance.patch(`/modules/${code}/enable`),
  disable: (code: string) => axiosInstance.patch(`/modules/${code}/disable`),
  enableForTenant: (code: string, tenantId: string) => axiosInstance.patch(`/modules/${code}/enable/${tenantId}`),
  disableForTenant: (code: string, tenantId: string) => axiosInstance.patch(`/modules/${code}/disable/${tenantId}`),
};

// Permission API
export const permissionApi = {
  getMyPermissions: () => fetchOnce('permissions:me', () => axiosInstance.get('/permissions/me')),
  checkPermission: (code: string) => axiosInstance.get(`/permissions/check/${code}`),
};

// Team Management API
export const teamApi = {
  getTeam: () => axiosInstance.get('/admin/team'),
  invite: (data: { email: string; firstName?: string; lastName?: string; role: number }) =>
    axiosInstance.post('/admin/team/invite', data),
  updateRole: (userId: string, role: number) =>
    axiosInstance.put(`/admin/team/${userId}/role`, { role }),
  remove: (userId: string) => axiosInstance.delete(`/admin/team/${userId}`),
  resetPassword: (userId: string) => axiosInstance.post(`/admin/team/${userId}/reset-password`),
};

// Demand Forecast API
export const demandForecastApi = {
  getForecast: () => axiosInstance.get('/inventory/demand-forecast'),
};
