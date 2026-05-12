import axiosInstance from './axiosInstance';

export const inventoryApi = {
  // Categories
  getCategories: () => axiosInstance.get('/inventory/categories').then(r => r.data),
  createCategory: (data: any) => axiosInstance.post('/inventory/categories', data).then(r => r.data),
  updateCategory: (id: string, data: any) => axiosInstance.put(`/inventory/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id: string, targetCategoryId?: string) => axiosInstance.delete(`/inventory/categories/${id}`, { params: { targetCategoryId } }).then(r => r.data),

  // Products
  getProducts: (params?: any) => axiosInstance.get('/inventory/products', { params }).then(r => r.data),
  getProduct: (id: string) => axiosInstance.get(`/inventory/products/${id}`).then(r => r.data),
  createProduct: (data: any) => axiosInstance.post('/inventory/products', data).then(r => r.data),
  updateProduct: (id: string, data: any) => axiosInstance.put(`/inventory/products/${id}`, data).then(r => r.data),
  deleteProduct: (id: string) => axiosInstance.delete(`/inventory/products/${id}`).then(r => r.data),
  getLowStock: () => axiosInstance.get('/inventory/products/low-stock').then(r => r.data),

  // Warehouses
  getWarehouses: () => axiosInstance.get('/inventory/warehouses').then(r => r.data),
  createWarehouse: (data: any) => axiosInstance.post('/inventory/warehouses', data).then(r => r.data),
  updateWarehouse: (id: string, data: any) => axiosInstance.put(`/inventory/warehouses/${id}`, data).then(r => r.data),

  // Stock Movements
  adjustStock: (data: any) => axiosInstance.post('/inventory/stock/adjust', data).then(r => r.data),
  transferStock: (data: any) => axiosInstance.post('/inventory/stock/transfer', data).then(r => r.data),
  getMovements: (params?: any) => axiosInstance.get('/inventory/stock/movements', { params }).then(r => r.data),
  getSummary: () => axiosInstance.get('/inventory/stock/summary').then(r => r.data),

  getBatches: (productId?: string) => axiosInstance.get('/inventory/batches', { params: { productId } }).then(r => r.data),
  createBatch: (data: any) => axiosInstance.post('/inventory/batches', data).then(r => r.data),
  updateBatch: (id: string, data: any) => axiosInstance.put(`/inventory/batches/${id}`, data).then(r => r.data),
  deleteBatch: (id: string) => axiosInstance.delete(`/inventory/batches/${id}`).then(r => r.data),
  getExpiringBatches: (daysAhead: number = 30) => axiosInstance.get('/inventory/batches/expiring', { params: { daysAhead } }).then(r => r.data),

  getTransfers: (status?: number) => axiosInstance.get('/inventory/transfers', { params: { status } }).then(r => r.data),
  createTransfer: (data: any) => axiosInstance.post('/inventory/transfers', data).then(r => r.data),
  approveTransfer: (id: string) => axiosInstance.post(`/inventory/transfers/${id}/approve`).then(r => r.data),
  completeTransfer: (id: string) => axiosInstance.post(`/inventory/transfers/${id}/complete`).then(r => r.data),
  cancelTransfer: (id: string) => axiosInstance.post(`/inventory/transfers/${id}/cancel`).then(r => r.data),
  getProductStock: (productId: string) => axiosInstance.get(`/inventory/products/${productId}/stock`).then(r => r.data),
  getWarehouseStock: (warehouseId: string) => axiosInstance.get(`/inventory/warehouses/${warehouseId}/stock`).then(r => r.data),
  getLowStockAlerts: () => axiosInstance.get('/inventory/stock/alerts/low-stock').then(r => r.data),
};
