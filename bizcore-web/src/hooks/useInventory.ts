import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';

export const useInventory = (params?: { search?: string, lowStockOnly?: boolean }) => {
  const queryClient = useQueryClient();

  const categories = useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: () => inventoryApi.getCategories(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const products = useQuery({
    queryKey: ['inventory', 'products', params],
    queryFn: () => inventoryApi.getProducts(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const allProducts = useQuery({
    queryKey: ['inventory', 'products', 'all'],
    queryFn: () => inventoryApi.getProducts({}),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const warehouses = useQuery({
    queryKey: ['inventory', 'warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const movements = useQuery({
    queryKey: ['inventory', 'movements'],
    queryFn: () => inventoryApi.getMovements(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const summary = useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: () => inventoryApi.getSummary(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const createProduct = useMutation({
    mutationFn: (data: any) => inventoryApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });

  const createCategory = useMutation({
    mutationFn: (data: any) => inventoryApi.createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] }),
  });

  const adjustStock = useMutation({
    mutationFn: (data: any) => inventoryApi.adjustStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });

  return {
    categories,
    products,
    allProducts,
    warehouses,
    movements,
    summary,
    createProduct,
    createCategory,
    adjustStock,
  };
};
