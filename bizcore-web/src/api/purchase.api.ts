import axiosInstance from './axiosInstance';

export const purchaseApi = {
  getOrders: (params?: any) => axiosInstance.get('/purchase/orders', { params }).then(r => r.data),
  getOrder: (id: string) => axiosInstance.get(`/purchase/orders/${id}`).then(r => r.data),
  createOrder: (data: any) => axiosInstance.post('/purchase/orders', data).then(r => r.data),
  updateOrder: (id: string, data: any) => axiosInstance.put(`/purchase/orders/${id}`, data).then(r => r.data),
  deleteOrder: (id: string) => axiosInstance.delete(`/purchase/orders/${id}`).then(r => r.data),
  submitOrder: (id: string) => axiosInstance.post(`/purchase/orders/${id}/submit`).then(r => r.data),
  sendOrder: (id: string) => axiosInstance.post(`/purchase/orders/${id}/submit`).then(r => r.data),
  receiveOrder: (id: string) => axiosInstance.post(`/purchase/orders/${id}/receive`).then(r => r.data),
  cancelOrder: (id: string) => axiosInstance.post(`/purchase/orders/${id}/cancel`).then(r => r.data),
  approveOrder: (id: string, notes?: string) => axiosInstance.post(`/purchase/orders/${id}/approve`, { notes }).then(r => r.data),
  rejectOrder: (id: string, notes: string) => axiosInstance.post(`/purchase/orders/${id}/reject`, { notes }).then(r => r.data),
  getPendingApproval: () => axiosInstance.get('/purchase/orders/pending-approval').then(r => r.data),
  getAnalytics: () => axiosInstance.get('/purchase/analytics').then(r => r.data),

  createReceipt: (data: any) => axiosInstance.post('/purchase/receipts', data).then(r => r.data),
  getReceipts: (orderId?: string) => axiosInstance.get('/purchase/receipts', { params: { orderId } }).then(r => r.data),
  getReceipt: (id: string) => axiosInstance.get(`/purchase/receipts/${id}`).then(r => r.data),

  createReturn: (data: any) => axiosInstance.post('/purchase/returns', data).then(r => r.data),
  getReturns: (orderId?: string) => axiosInstance.get('/purchase/returns', { params: { orderId } }).then(r => r.data),
  getReturn: (id: string) => axiosInstance.get(`/purchase/returns/${id}`).then(r => r.data),
  approveReturn: (id: string) => axiosInstance.post(`/purchase/returns/${id}/approve`).then(r => r.data),
  rejectReturn: (id: string) => axiosInstance.post(`/purchase/returns/${id}/reject`).then(r => r.data),

  createPayment: (data: any) => axiosInstance.post('/purchase/payments', data).then(r => r.data),
  getPayments: (orderId?: string) => axiosInstance.get('/purchase/payments', { params: { orderId } }).then(r => r.data),
  getPayment: (id: string) => axiosInstance.get(`/purchase/payments/${id}`).then(r => r.data),

  getSuppliers: (params?: any) => axiosInstance.get('/purchase/suppliers', { params }).then(r => r.data),
  getSupplier: (id: string) => axiosInstance.get(`/purchase/suppliers/${id}`).then(r => r.data),
  createSupplier: (data: any) => axiosInstance.post('/purchase/suppliers', data).then(r => r.data),
  updateSupplier: (id: string, data: any) => axiosInstance.put(`/purchase/suppliers/${id}`, data).then(r => r.data),
  deleteSupplier: (id: string) => axiosInstance.delete(`/purchase/suppliers/${id}`).then(r => r.data),
  getSupplierBalance: (id: string) => axiosInstance.get(`/purchase/suppliers/${id}/balance`).then(r => r.data),

  getPurchaseSummary: (fromDate: string, toDate: string) => 
    axiosInstance.get('/purchase/reports/summary', { params: { fromDate, toDate } }).then(r => r.data),
  getSupplierLedger: (id: string, fromDate: string, toDate: string) => 
    axiosInstance.get(`/purchase/reports/supplier-ledger/${id}`, { params: { fromDate, toDate } }).then(r => r.data),
  getTaxReport: (fromDate: string, toDate: string) => 
    axiosInstance.get('/purchase/reports/tax', { params: { fromDate, toDate } }).then(r => r.data),
};