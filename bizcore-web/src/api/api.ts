import axiosInstance from './axiosInstance';
import { fetchOnce } from '../utils/fetchOnce';

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const authApi = {
  register: (data: any) => axiosInstance.post('/auth/register', data),
  login: (data: any) => axiosInstance.post('/auth/login', data),
  logout: (refreshToken: string) => axiosInstance.post('/auth/logout', { refreshToken }),
  changePassword: (data: ChangePasswordRequest) => axiosInstance.put('/auth/change-password', data),
};

export const businessApi = {
  create: (data: any) => axiosInstance.post('/business/create', data),
  getMe: () => fetchOnce('business:me', () => axiosInstance.get('/business/me')),
  update: (data: any) => axiosInstance.put('/business/update', data),
  createBranch: (data: any) => axiosInstance.post('/business/branch/create', data),
  getBranches: () => axiosInstance.get('/business/branches'),
};

export const dashboardApi = {
  getDashboard: () => axiosInstance.get('/dashboard'),
  getOwner: () => axiosInstance.get('/dashboard/owner'),
  getFinance: () => axiosInstance.get('/dashboard/finance'),
  getHr: () => axiosInstance.get('/dashboard/hr'),
  getSales: () => axiosInstance.get('/dashboard/sales'),
  getPos: () => axiosInstance.get('/dashboard/pos'),
};

export const bootstrapApi = {
  get: () => axiosInstance.get('/bootstrap'),
};

export const khataApi = {
  createParty: (data: any) => axiosInstance.post('/khata/party', data),
  getParties: () => axiosInstance.get('/khata/parties'),
  createEntry: (data: any) => axiosInstance.post('/khata/entry', data),
  getEntries: (params?: any) => axiosInstance.get('/khata/entries', { params }),
  getBalance: (id: string) => axiosInstance.get(`/khata/party/${id}/balance`),
  createReminder: (data: any) => axiosInstance.post('/khata/reminder', data),
  deleteParty: (id: string) => axiosInstance.delete(`/khata/party/${id}`),
};

export const contactApi = {
  create: (data: any) => axiosInstance.post('/contacts', data),
  getAll: (params?: any) => axiosInstance.get('/contacts', { params }),
  getById: (id: string) => axiosInstance.get(`/contacts/${id}`),
  update: (id: string, data: any) => axiosInstance.put(`/contacts/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/contacts/${id}`),
  getTransactions: (id: string) => axiosInstance.get(`/contacts/${id}/transactions`),
};

export const invoiceApi = {
  create: (data: any) => axiosInstance.post('/invoices', data),
  getAll: (params?: any) => axiosInstance.get('/invoices', { params }),
  getById: (id: string) => axiosInstance.get(`/invoices/${id}`),
  update: (id: string, data: any) => axiosInstance.put(`/invoices/${id}`, data),
  markPaid: (id: string) => axiosInstance.put(`/invoices/${id}/mark-paid`),
  getPdf: (id: string) => axiosInstance.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

export const reportApi = {
  getSalesSummary: (params?: any) => axiosInstance.get('/reports/sales-summary', { params }),
  getProfitLoss: (params?: any) => axiosInstance.get('/reports/profit-loss', { params }),
  getOutstanding: () => axiosInstance.get('/reports/outstanding'),
  getVatReport: (params?: any) => axiosInstance.get('/reports/vat-report', { params }),
  getInventoryValuation: () => axiosInstance.get('/reports/inventory-valuation').then(r => r.data),
  getCashFlow: (params?: any) => axiosInstance.get('/reports/cash-flow', { params }).then(r => r.data),
};

export const expensesApi = {
  create: (data: any) => axiosInstance.post('/expenses', data),
  getAll: (params?: any) => axiosInstance.get('/expenses', { params }),
  update: (id: string, data: any) => axiosInstance.put(`/expenses/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/expenses/${id}`),
  getSummary: (params?: any) => axiosInstance.get('/expenses/summary', { params }),
  getCategories: () => axiosInstance.get('/expenses/categories'),
};

export const bankingApi = {
  createAccount: (data: any) => axiosInstance.post('/banking/accounts', data),
  getAccounts: () => axiosInstance.get('/banking/accounts'),
  updateAccount: (id: string, data: any) => axiosInstance.put(`/banking/accounts/${id}`, data),
  deleteAccount: (id: string) => axiosInstance.delete(`/banking/accounts/${id}`),
  createTransaction: (data: any) => axiosInstance.post('/banking/transactions', data),
  getTransactions: (params?: any) => axiosInstance.get('/banking/transactions', { params }),
  deleteTransaction: (id: string) => axiosInstance.delete(`/banking/transactions/${id}`),
  getCashBook: (params?: any) => axiosInstance.get('/banking/cashbook', { params }),
  getSummary: () => axiosInstance.get('/banking/summary'),
};
