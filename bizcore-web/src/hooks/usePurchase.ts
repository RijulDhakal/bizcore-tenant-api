import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi } from '../api/purchase.api';

export const usePurchase = () => {
  const queryClient = useQueryClient();

  const orders = (params?: any) => useQuery({
    queryKey: ['purchase', 'orders', params],
    queryFn: () => purchaseApi.getOrders(params),
  });

  const order = (id: string) => useQuery({
    queryKey: ['purchase', 'orders', id],
    queryFn: () => purchaseApi.getOrder(id),
    enabled: !!id,
  });

  const analytics = useQuery({
    queryKey: ['purchase', 'analytics'],
    queryFn: () => purchaseApi.getAnalytics(),
  });

  const pendingApproval = useQuery({
    queryKey: ['purchase', 'orders', 'pending-approval'],
    queryFn: () => purchaseApi.getPendingApproval(),
  });

  const createOrder = useMutation({
    mutationFn: (data: any) => purchaseApi.createOrder(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] }),
  });

  const updateOrder = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => purchaseApi.updateOrder(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] }),
  });

  const deleteOrder = useMutation({
    mutationFn: (id: string) => purchaseApi.deleteOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] }),
  });

  const submitOrder = useMutation({
    mutationFn: (id: string) => purchaseApi.submitOrder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] }),
  });

  const approveOrder = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => purchaseApi.approveOrder(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'orders', 'pending-approval'] });
    },
  });

  const rejectOrder = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => purchaseApi.rejectOrder(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'orders', 'pending-approval'] });
    },
  });

  const receipts = (orderId?: string) => useQuery({
    queryKey: ['purchase', 'receipts', orderId],
    queryFn: () => purchaseApi.getReceipts(orderId),
  });

  const createReceipt = useMutation({
    mutationFn: (data: any) => purchaseApi.createReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'receipts'] });
    },
  });

  const returns = (orderId?: string) => useQuery({
    queryKey: ['purchase', 'returns', orderId],
    queryFn: () => purchaseApi.getReturns(orderId),
  });

  const createReturn = useMutation({
    mutationFn: (data: any) => purchaseApi.createReturn(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'returns'] }),
  });

  const approveReturn = useMutation({
    mutationFn: (id: string) => purchaseApi.approveReturn(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'returns'] }),
  });

  const rejectReturn = useMutation({
    mutationFn: (id: string) => purchaseApi.rejectReturn(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'returns'] }),
  });

  const payments = (orderId?: string) => useQuery({
    queryKey: ['purchase', 'payments', orderId],
    queryFn: () => purchaseApi.getPayments(orderId),
  });

  const createPayment = useMutation({
    mutationFn: (data: any) => purchaseApi.createPayment(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'payments'] }),
  });

  const suppliers = (params?: any) => useQuery({
    queryKey: ['purchase', 'suppliers', params],
    queryFn: () => purchaseApi.getSuppliers(params),
  });

  const supplier = (id: string) => useQuery({
    queryKey: ['purchase', 'suppliers', id],
    queryFn: () => purchaseApi.getSupplier(id),
    enabled: !!id,
  });

  const createSupplier = useMutation({
    mutationFn: (data: any) => purchaseApi.createSupplier(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'suppliers'] }),
  });

  const updateSupplier = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => purchaseApi.updateSupplier(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'suppliers'] }),
  });

  const deleteSupplier = useMutation({
    mutationFn: (id: string) => purchaseApi.deleteSupplier(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase', 'suppliers'] }),
  });

  const supplierBalance = (id: string) => useQuery({
    queryKey: ['purchase', 'suppliers', id, 'balance'],
    queryFn: () => purchaseApi.getSupplierBalance(id),
    enabled: !!id,
  });

  const purchaseSummary = (fromDate: string, toDate: string) => useQuery({
    queryKey: ['purchase', 'reports', 'summary', fromDate, toDate],
    queryFn: () => purchaseApi.getPurchaseSummary(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  });

  const supplierLedger = (id: string, fromDate: string, toDate: string) => useQuery({
    queryKey: ['purchase', 'reports', 'ledger', id, fromDate, toDate],
    queryFn: () => purchaseApi.getSupplierLedger(id, fromDate, toDate),
    enabled: !!id && !!fromDate && !!toDate,
  });

  const taxReport = (fromDate: string, toDate: string) => useQuery({
    queryKey: ['purchase', 'reports', 'tax', fromDate, toDate],
    queryFn: () => purchaseApi.getTaxReport(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  });

  return {
    orders,
    order,
    analytics,
    pendingApproval,
    createOrder,
    updateOrder,
    deleteOrder,
    submitOrder,
    approveOrder,
    rejectOrder,
    receipts,
    createReceipt,
    returns,
    createReturn,
    approveReturn,
    rejectReturn,
    payments,
    createPayment,
    suppliers,
    supplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    supplierBalance,
    purchaseSummary,
    supplierLedger,
    taxReport,
  };
};