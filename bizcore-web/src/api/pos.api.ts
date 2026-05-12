import axiosInstance from './axiosInstance';

export const posApi = {
  // Sessions
  openSession: (data: any) => axiosInstance.post('/pos/sessions/open', data).then(r => r.data),
  closeSession: (id: string, data: any) => axiosInstance.put(`/pos/sessions/${id}/close`, data).then(r => r.data),
  getCurrentSession: () => axiosInstance.get('/pos/sessions/current').then(r => r.data),
  getSessionSummary: (id: string) => axiosInstance.get(`/pos/sessions/${id}/summary`).then(r => r.data),

  // Transactions
  createTransaction: (data: any) => axiosInstance.post('/pos/transactions', data).then(r => r.data),
  getTransactions: (params?: any) => axiosInstance.get('/pos/transactions', { params }).then(r => r.data),
  getTransaction: (id: string) => axiosInstance.get(`/pos/transactions/${id}`).then(r => r.data),
  refundTransaction: (id: string) => axiosInstance.put(`/pos/transactions/${id}/refund`).then(r => r.data),

  // Products
  getProducts: () => axiosInstance.get('/pos/products').then(r => r.data),
  searchProducts: (q: string) => axiosInstance.get('/pos/products/search', { params: { q } }).then(r => r.data),

  // Analytics
  getDailyAnalytics: (date: string) => axiosInstance.get('/pos/analytics/daily', { params: { date } }).then(r => r.data),
  getSummaryAnalytics: (dateFrom: string, dateTo: string) => axiosInstance.get('/pos/analytics/summary', { params: { dateFrom, dateTo } }).then(r => r.data),
  getAnalytics: () => axiosInstance.get('/pos/analytics/summary').then(r => r.data),

  // Hold Orders
  holdOrder: (data: any) => axiosInstance.post('/pos/orders/hold', data).then(r => r.data),
  getHeldOrders: () => axiosInstance.get('/pos/orders/held').then(r => r.data),
  recallOrder: (id: string) => axiosInstance.post(`/pos/orders/${id}/recall`).then(r => r.data),

  // Z-Report
  getZReport: (date: string) => axiosInstance.get('/pos/reports/z-report', { params: { date }, responseType: 'blob' }).then(r => r.data),
};
