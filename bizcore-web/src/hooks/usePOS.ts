import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '../api/pos.api';

export const usePOS = () => {
  const queryClient = useQueryClient();

  const currentSession = useQuery({
    queryKey: ['pos', 'current-session'],
    queryFn: () => posApi.getCurrentSession(),
    retry: false,
  });

  const products = useQuery({
    queryKey: ['pos', 'products'],
    queryFn: () => posApi.getProducts(),
  });

  const openSession = useMutation({
    mutationFn: (data: any) => posApi.openSession(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pos', 'current-session'] }),
  });

  const createTransaction = useMutation({
    mutationFn: (data: any) => posApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'current-session'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    },
  });

  const dashboard = useQuery({
    queryKey: ['pos', 'dashboard'],
    queryFn: () => posApi.getAnalytics(),
  });

  return {
    currentSession,
    products,
    openSession,
    createTransaction,
    dashboard,
  };
};
