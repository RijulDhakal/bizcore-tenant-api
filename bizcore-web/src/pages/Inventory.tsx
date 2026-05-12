import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  History, 
  Edit2, 
  Trash2,
  Loader2,
  ChevronRight,
  Warehouse
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Card, 
  CardContent, 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { inventoryApi } from '../api/inventory.api';
import { useQueryClient } from '@tanstack/react-query';
import { NumberInput } from '../components/ui/number-input';
import { Switch } from '../components/ui/switch';
import { BatchForm, type BatchFormData } from '../components/BatchForm';
import { ProductDetailDrawer } from '../components/ProductDetailDrawer';

const warehouseStockEntrySchema = z.object({
  warehouseId: z.string(),
  openingStock: z.number().min(0).default(0),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  manufactureDate: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unit is required'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  isVatApplicable: z.boolean().default(true),
  brand: z.string().optional().nullable(),
  reorderQuantity: z.number().min(0, 'Reorder qty cannot be negative').default(0),
  trackExpiry: z.boolean().default(false),
  hsnCode: z.string().optional().nullable(),
  lowStockThreshold: z.number().min(0, 'Threshold cannot be negative'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  warehouseStocks: z.array(warehouseStockEntrySchema).optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parentCategoryId: z.string().optional().nullable(),
});

const adjustSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  type: z.number(), // 0: StockIn, 1: StockOut, 2: Adjustment
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  note: z.string().optional(),
});

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().optional(),
  contactPerson: z.string().min(1, 'Contact person is required'),
  contactPhone: z.string()
    .min(1, 'Phone is required')
    .regex(/^(0[1-9]\d{6,7}|(98|97|96)\d{8})$/, 'Invalid Nepal phone (mobile: 9841234567, landline: 01-1234567)'),
  type: z.number().min(0).max(3),
  status: z.number().min(0).max(2),
  allowNegativeStock: z.boolean(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

const transferSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  fromWarehouseId: z.string().min(1, 'From warehouse is required'),
  toWarehouseId: z.string().min(1, 'To warehouse is required'),
  batchId: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be positive'),
  notes: z.string().optional(),
  type: z.number(),
  priority: z.number(),
  expectedDeliveryDate: z.string().optional(),
  reason: z.number().optional(),
  shippingCost: z.number().optional(),
  trackingNumber: z.string().optional(),
  requiresApproval: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;
type CategoryFormValues = z.infer<typeof categorySchema>;
type AdjustFormValues = z.infer<typeof adjustSchema>;
type WarehouseFormValues = z.infer<typeof warehouseSchema>;
type TransferFormValues = z.infer<typeof transferSchema>;

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'products');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTransferProduct, setSelectedTransferProduct] = useState<any>(null);
  const [transferProductBatches, setTransferProductBatches] = useState<any[]>([]);
  const [transferByBatch, setTransferByBatch] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<any>(null);
  const [showCategoryProducts, setShowCategoryProducts] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categoryExpanded, setCategoryExpanded] = useState<Set<string>>(new Set());
  const [stockWarehouseSearch, setStockWarehouseSearch] = useState('');
  const [warehouseListSearch, setWarehouseListSearch] = useState('');
  const [categoryListSearch, setCategoryListSearch] = useState('');

  const queryClient = useQueryClient();
  const { categories, products, allProducts, warehouses, movements, summary } = useInventory({ search, lowStockOnly });
  
  const productList = products.data?.data || [];
  const fullProductList = allProducts.data?.data || [];
  const categoryList = categories.data?.data || [];
  const warehouseList = warehouses.data?.data || [];
  const movementList = movements.data?.data || [];
  const invSummary = summary.data?.data;

  const toggleCategoryExpand = (id: string, forceOpen?: boolean) => {
    setCategoryExpanded(prev => {
      const next = new Set(prev);
      if (forceOpen) {
        next.add(id);
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const getFlattenedCategories = (cats: any[], options: { search?: string, currentDepth?: number } = {}): any[] => {
    const { search = '', currentDepth = 0 } = options;
    return (cats || []).flatMap(c => {
      if (!c) return [];
      
      const subCats = c.subCategories || [];
      const subCategoriesMatched = getFlattenedCategories(subCats, { search, currentDepth: currentDepth + 1 });
      
      const matchesSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase());
      const hasMatchingDescendants = subCategoriesMatched.length > 0;
      
      const isExpanded = categoryExpanded.has(c.id);
      const shouldShowChildren = isExpanded || !!search;
      
      if (matchesSearch || hasMatchingDescendants) {
        return [
          { ...c, depth: currentDepth, hasChildren: subCats.length > 0 },
          ...(shouldShowChildren ? subCategoriesMatched : [])
        ];
      }
      return [];
    }).filter(Boolean);
  };
  
  // Truly flat list for label lookups (independent of state)
  const categoriesMap = useMemo(() => {
    const map = new Map<string, string>();
    const flatten = (items: any[]) => {
      items.forEach(c => {
        if (!c) return;
        map.set(c.id.toLowerCase(), c.name);
        if (c.subCategories?.length) flatten(c.subCategories);
      });
    };
    flatten(categoryList || []);
    return map;
  }, [categoryList]);
  
  useEffect(() => {
    if (!categorySearch || !categoryList?.length) return;
    
    const matchingIds = new Set<string>();
    const findMatches = (cats: any[], term: string) => {
      cats.forEach(c => {
        if (c.name?.toLowerCase().includes(term.toLowerCase())) {
          matchingIds.add(c.id);
        }
        if (c.subCategories?.length) {
          findMatches(c.subCategories, term);
        }
      });
    };
    findMatches(categoryList, categorySearch);
    
    const parentIds = new Set<string>();
    const findParents = (cats: any[], targetId: string, parents: string[]): boolean => {
      for (const c of cats) {
        if (c.id === targetId) {
          parents.forEach(p => parentIds.add(p));
          return true;
        }
        if (c.subCategories?.length) {
          if (findParents(c.subCategories, targetId, [...parents, c.id])) return true;
        }
      }
      return false;
    };
    matchingIds.forEach(id => findParents(categoryList, id, []));
    
    if (parentIds.size > 0) {
      setCategoryExpanded(prev => {
        const next = new Set(prev);
        parentIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [categorySearch, categoryList]);

const filteredCategories = useMemo(() => getFlattenedCategories(categoryList, { search: categorySearch }), [categoryList, categorySearch, categoryExpanded]);
  
  // Full flattened list for display
  const allCategoriesFlat = useMemo(() => getFlattenedCategories(categoryList, {}), [categoryList, categoryExpanded]);
   
  // List for category management table (with expansion state)
  const filteredCategoryList = useMemo(() => getFlattenedCategories(categoryList, { search: categoryListSearch }), [categoryList, categoryListSearch, categoryExpanded]);

  const filteredWarehousesForStock = warehouseList.filter((w: any) =>
    w.name.toLowerCase().includes(stockWarehouseSearch.toLowerCase()) ||
    w.city?.toLowerCase().includes(stockWarehouseSearch.toLowerCase()) ||
    w.location?.toLowerCase().includes(stockWarehouseSearch.toLowerCase())
  );

  const filteredWarehouses = warehouseList.filter((w: any) =>
    w.name.toLowerCase().includes(warehouseListSearch.toLowerCase()) ||
    w.city?.toLowerCase().includes(warehouseListSearch.toLowerCase()) ||
    w.location?.toLowerCase().includes(warehouseListSearch.toLowerCase()) ||
    w.contactPerson?.toLowerCase().includes(warehouseListSearch.toLowerCase())
  );

  const [batches, setBatches] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [warehouseStock, setWarehouseStock] = useState<any[]>([]);
  const [warehouseStockLoading, setWarehouseStockLoading] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchFormData & { id?: string } | null>(null);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [targetCategoryIdForDelete, setTargetCategoryIdForDelete] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'batches') {
      setBatchesLoading(true);
      inventoryApi.getBatches().then(r => {
        setBatches(r?.data || []);
      }).finally(() => setBatchesLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'warehouses' && selectedWarehouse) {
      setWarehouseStockLoading(true);
      inventoryApi.getWarehouseStock(selectedWarehouse.id).then(r => {
        setWarehouseStock(r?.data || []);
      }).finally(() => setWarehouseStockLoading(false));
    }
  }, [activeTab, selectedWarehouse]);

  useEffect(() => {
    if (activeTab === 'transfers') {
      setTransfersLoading(true);
      inventoryApi.getTransfers().then(r => {
        setTransfers(r?.data || []);
      }).finally(() => setTransfersLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
    
    const action = searchParams.get('action');
    if (action === 'add-product') {
      setSelectedProduct(null);
      productForm.reset();
      setBatches([]);
      setIsProductOpen(true);
      // Clear action parameter from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    } else if (action === 'add-category') {
      setSelectedCategory(null);
      categoryForm.reset({ name: '', description: '', parentCategoryId: null });
      setIsCategoryOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    } else if (action === 'add-warehouse') {
      setIsWarehouseOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

   const productForm = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: 'pcs',
      currentStock: 0,
      lowStockThreshold: 10,
      costPrice: 0,
      sellingPrice: 0,
      isVatApplicable: true,
      brand: '',
      reorderQuantity: 0,
      trackExpiry: false,
      hsnCode: '',
      sku: '',
      barcode: '',
      description: '',
      isActive: true,
      warehouseStocks: []
    }
  });

  const { formState: { errors: productErrors } } = productForm;
  if (Object.keys(productErrors).length > 0) {
    console.log('Product Form errors:', productErrors);
  }

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' }
  });

  const adjustForm = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: 0, quantity: 1, note: '' }
  });

  const warehouseForm = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      city: '',
      district: '',
      contactPerson: '',
      contactPhone: '',
      type: 0,
      status: 0,
      allowNegativeStock: false,
      isDefault: false,
      isActive: true,
    }
  });

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      type: 0,
      priority: 0,
      quantity: 1,
      requiresApproval: false,
    }
  });

  const onProductSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...values,
        categoryId: values.categoryId || undefined, // explicit mapping
        warehouseStocks: values.trackExpiry 
          ? batches.map((b: any) => ({
              warehouseId: b.warehouseId,
              openingStock: b.initialQuantity,
              batchNumber: b.batchNumber || undefined,
              expiryDate: b.expiryDate || undefined,
              manufactureDate: b.manufactureDate || undefined,
            }))
          : stockEntries
              .filter((e: any) => e.openingStock > 0)
              .map((e: any) => ({
                warehouseId: e.warehouseId,
                openingStock: e.openingStock,
                batchNumber: e.batchNumber || undefined,
                expiryDate: e.expiryDate || undefined,
                manufactureDate: e.manufactureDate || undefined,
              })),
      };

      if (selectedProduct) {
        await inventoryApi.updateProduct(selectedProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await inventoryApi.createProduct(payload);
        toast.success('Product registered successfully');
      }

      setIsProductOpen(false);
      productForm.reset({
        name: '',
        sku: '',
        barcode: '',
        categoryId: undefined,
        unit: 'pcs',
        costPrice: 0,
        sellingPrice: 0,
        isVatApplicable: true,
        brand: '',
        reorderQuantity: 0,
        trackExpiry: false,
        hsnCode: '',
        lowStockThreshold: 10,
        description: '',
        isActive: true,
        warehouseStocks: []
      });
      setStockEntries([]);
      setBatches([]);
      setIsBatchFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCategorySubmit: SubmitHandler<CategoryFormValues> = async (values) => {
    try {
      setIsSubmitting(true);
      if (selectedCategory) {
        await inventoryApi.updateCategory(selectedCategory.id, values);
        toast.success('Category updated');
        setIsCategoryOpen(false);
        setSelectedCategory(null);
      } else {
        await inventoryApi.createCategory(values);
        toast.success('Category added');
        if (values.parentCategoryId) {
           toggleCategoryExpand(values.parentCategoryId, true);
        }
        setIsCategoryOpen(false);
      }
      categoryForm.reset({ name: '', description: '', parentCategoryId: null });
      await queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] });
      await queryClient.refetchQueries({ queryKey: ['inventory', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    } catch (err) {
      console.error('Category submit error:', err);
      toast.error(selectedCategory ? 'Failed to update category' : 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: any) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;
    try {
      await inventoryApi.deleteCategory(category.id);
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] });
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleDeleteCategoryWithCheck = (category: any) => {
    if (category.productCount > 0) {
      setCategoryToDelete(category);
      setTargetCategoryIdForDelete(null);
      setIsDeleteDialogOpen(true);
    } else {
      handleDeleteCategory(category);
    }
  };

  const handleViewCategoryProducts = (category: any) => {
    // If category has children (sub-categories), toggle expand instead of showing products drawer
    if (category.hasChildren || (category.subCategories && category.subCategories.length > 0)) {
      toggleCategoryExpand(category.id);
      return;
    }
    // Only leaf categories (no children) show products drawer
    setSelectedCategoryForProducts(category);
    setShowCategoryProducts(true);
  };

  const onConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setIsSubmitting(true);
      await inventoryApi.deleteCategory(categoryToDelete.id, targetCategoryIdForDelete || undefined);
      toast.success('Category deleted');
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAdjustSubmit: SubmitHandler<AdjustFormValues> = async (values) => {
    try {
      setIsSubmitting(true);
      await inventoryApi.adjustStock(values);
      toast.success('Stock adjusted');
      setIsAdjustmentOpen(false);
      adjustForm.reset();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err) {
      toast.error('Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onWarehouseSubmit: SubmitHandler<WarehouseFormValues> = async (values) => {
    try {
      setIsSubmitting(true);
      await inventoryApi.createWarehouse(values);
      toast.success('Warehouse added successfully');
      setIsWarehouseOpen(false);
      warehouseForm.reset();
      queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onTransferSubmit = async (values: TransferFormValues) => {
    try {
      setIsSubmitting(true);
      await inventoryApi.createTransfer(values);
      toast.success('Transfer created successfully');
      setIsTransferOpen(false);
      transferForm.reset();
      inventoryApi.getTransfers().then(r => setTransfers(r?.data || []));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;
    try {
      await inventoryApi.deleteProduct(product.id);
      toast.success('Product removed');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    } catch {
      toast.error('Failed to remove product');
    }
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    productForm.reset({
      name: product.name,
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      unit: product.unit,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      isVatApplicable: product.isVatApplicable ?? true,
      brand: product.brand || '',
      reorderQuantity: product.reorderQuantity || 0,
      trackExpiry: product.trackExpiry || false,
      hsnCode: product.hsnCode || '',
      lowStockThreshold: product.lowStockThreshold,
      barcode: product.barcode || '',
      description: product.description || '',
      isActive: product.isActive ?? true,
      warehouseStocks: []
    });
    if (product.trackExpiry) {
      inventoryApi.getBatches(product.id).then(r => {
        setBatches(r?.data || []);
      });
    } else {
      setBatches([]);
    }
    setIsProductOpen(true);
  };

  const handleSaveBatch = (batch: BatchFormData & { id?: string }) => {
    if (batch.id) {
      setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, ...batch } : b));
      setIsBatchFormOpen(false);
      setEditingBatch(null);
    } else {
      setBatches(prev => [...prev, { ...batch, id: `temp-${Date.now()}` }]);
      toast.success('Batch added to list');
      // Keep form open for adding another batch
    }
  };

  const handleDeleteBatch = (index: number) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    setBatches(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor your products, stock levels, and movements across warehouses.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsAdjustmentOpen(true)} className="rounded-xl border-slate-100 font-bold">
             <History className="mr-2 h-4 w-4" /> Stock Correction
          </Button>
           <Button onClick={() => {
             setSelectedProduct(null);
             productForm.reset();
             setBatches([]);
             setIsBatchFormOpen(false);
             setIsProductOpen(true);
           }} className="rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {invSummary && invSummary.lowStockCount > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">{invSummary.lowStockCount} Low Stock Alerts</p>
                <p className="text-[11px] text-amber-700/70">Some products are below their minimum threshold.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-500/10 font-bold" onClick={() => setLowStockOnly(true)}>
              Review Stock <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-px">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger value="products" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 h-auto text-[11px] font-bold uppercase tracking-wider transition-all">Products</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 h-auto text-[11px] font-bold uppercase tracking-wider transition-all">Categories</TabsTrigger>
            <TabsTrigger value="warehouses" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 h-auto text-[11px] font-bold uppercase tracking-wider transition-all">Warehouses</TabsTrigger>
            <TabsTrigger value="movements" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 h-auto text-[11px] font-bold uppercase tracking-wider transition-all">Stock Movements</TabsTrigger>
            <TabsTrigger value="batches" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 h-auto text-[11px] font-bold uppercase tracking-wider transition-all">Batches</TabsTrigger>
            <TabsTrigger value="transfers" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 h-auto text-[11px] font-bold uppercase tracking-wider transition-all">Transfers</TabsTrigger>
          </TabsList>
          {activeTab === 'categories' && (
            <Button size="sm" variant="ghost" className="text-primary font-bold" onClick={() => {
              setSelectedCategory(null);
              categoryForm.reset({ name: '', description: '' });
              setIsCategoryOpen(true);
            }}>
              <Plus className="mr-1 h-4 w-4" /> Add Category
            </Button>
          )}
          {activeTab === 'warehouses' && (
            <Button size="sm" variant="ghost" className="text-primary font-bold" onClick={() => setIsWarehouseOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add Warehouse
            </Button>
          )}
          {activeTab === 'transfers' && (
            <Button size="sm" variant="ghost" className="text-primary font-bold" onClick={() => setIsTransferOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> New Transfer
            </Button>
          )}
        </div>

        <TabsContent value="products" className="mt-8 space-y-8 outline-none">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold" 
                placeholder="Search products by name, SKU or barcode..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                variant={lowStockOnly ? 'secondary' : 'outline'}
                className={`flex-1 md:flex-none h-12 rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest transition-all ${
                  lowStockOnly 
                    ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100' 
                    : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setLowStockOnly(!lowStockOnly)}
              >
                 <AlertTriangle className={`mr-2 h-3.5 w-3.5 ${lowStockOnly ? 'animate-pulse' : ''}`} /> 
                 {lowStockOnly ? 'Showing Low Stock' : 'Low Stock Only'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.isLoading ? (
               Array(8).fill(0).map((_, i) => (
                  <Card key={i} className="p-5 space-y-5 rounded-[2rem] border-slate-100">
                     <Skeleton className="h-4 w-2/3 rounded-full" />
                     <Skeleton className="h-3 w-1/3 rounded-full" />
                     <div className="pt-5 border-t border-slate-100/30 flex justify-between">
                        <Skeleton className="h-8 w-1/3 rounded-xl" />
                        <Skeleton className="h-8 w-1/3 rounded-xl" />
                     </div>
                  </Card>
               ))
            ) : productList.length > 0 ? (
               productList.map((product: any) => (
                  <Card key={product.id} className="group relative overflow-hidden rounded-[2rem] border-slate-100 bg-white transition-all hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1.5 cursor-pointer" onClick={() => {
                    setDetailProduct(product);
                    setIsDetailOpen(true);
                  }}>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full transition-all group-hover:scale-110" />
                     <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-8">
                           <div className="min-w-0 pr-4">
                              <h3 className="font-black truncate text-sm text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{product.sku || 'No SKU'}</p>
                           </div>
                           <Badge variant="outline" className="text-[8px] h-5 px-2.5 uppercase font-black border-indigo-100 bg-indigo-50/30 text-indigo-600 whitespace-nowrap">
                              {product.categoryName || 'General'}
                           </Badge>
                        </div>
                        
                        <div className="space-y-6">
                           <div className="flex items-end justify-between">
                               <div className="space-y-1.5">
                                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">Live Inventory</p>
                                 <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-black ${product.currentStock <= product.lowStockThreshold ? 'text-rose-500' : 'text-slate-900'}`}>
                                       {product.currentStock}
                                    </span>
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{product.unit || 'pcs'}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1">MSRP</p>
                                 <p className="text-indigo-600 font-black text-xl tracking-tight">{formatCurrency(product.sellingPrice)}</p>
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Base Cost</span>
                                <span className="text-[11px] font-bold text-slate-500">{formatCurrency(product.costPrice)}</span>
                              </div>
                              <div className="flex gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 transition-all" onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}>
                                    <Edit2 className="h-4 w-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-200 transition-all" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product); }}>
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ))
            ) : (
               <div className="col-span-full py-24 text-center">
                  <Package className="mx-auto h-16 w-16 text-slate-400 opacity-20 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto mt-2">Start by adding your first product to the inventory.</p>
               </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-8 outline-none animate-in fade-in duration-500">
           <Card className="rounded-[2.5rem] border-slate-100 bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100">
                 <div className="relative max-w-md">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                   <Input
                     placeholder="Search categories..."
                     value={categoryListSearch}
                     onChange={(e) => setCategoryListSearch(e.target.value)}
                     className="pl-9 h-9 rounded-lg text-xs"
                   />
                 </div>
              </div>
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100 hover:bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                       <TableHead className="w-[300px] py-6 pl-8">Category Entity</TableHead>
                       <TableHead className="py-6 text-center">Reference Specs</TableHead>
                       <TableHead className="py-6">Distribution</TableHead>
                       <TableHead className="text-right py-6 pr-8">Actions</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {categories.isLoading ? (
                       Array(5).fill(0).map((_, i) => (
                          <TableRow key={i} className="border-b border-slate-50">
                             <TableCell className="py-6 pl-8"><Skeleton className="h-4 w-32 rounded-full" /></TableCell>
                             <TableCell className="py-6"><Skeleton className="h-4 w-full rounded-full" /></TableCell>
             <TableCell className="py-6"><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                             <TableCell className="text-right py-6 pr-8"><Skeleton className="h-8 w-8 ml-auto rounded-xl" /></TableCell>
                          </TableRow>
                       ))
) : filteredCategoryList.length > 0 ? (
                         filteredCategoryList.map((cat: any) => (
                            <TableRow 
                              key={cat.id} 
                              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                              onClick={() => handleViewCategoryProducts(cat)}
                            >
                               <TableCell className="py-6 pl-8">
                                 <div className="flex items-center" style={{ paddingLeft: `${cat.depth * 24}px` }}>
                                   {cat.hasChildren ? (
                                     <button onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(cat.id); }} className="mr-2 text-xs hover:scale-110 transition-transform">
                                       {categoryExpanded.has(cat.id) ? '📂' : '📁'}
                                     </button>
                                   ) : (
                                     <span className="mr-2 w-4 h-4 flex items-center justify-center text-slate-300">
                                       <div className="w-1 h-1 rounded-full bg-slate-200" />
                                     </span>
                                   )}
                                   <span className={`uppercase tracking-tight ${cat.depth === 0 ? 'font-black text-slate-900 text-sm' : 'font-bold text-slate-600 text-xs'}`}>
                                     {cat.name}
                                   </span>
                                 </div>
                               </TableCell>
                               <TableCell className="text-slate-500 text-[11px] font-medium max-w-md py-6 text-center">{cat.description || 'No descriptive metadata provided'}</TableCell>
<TableCell className="py-6" onClick={(e) => e.stopPropagation()}>
                                   <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-black uppercase py-1 px-3 rounded-full">
                                     {cat.hasChildren 
                                       ? `${cat.subCategories?.length || 0} sub-categor${cat.subCategories?.length === 1 ? 'y' : 'ies'}` 
                                       : `${cat.productCount || 0} SKU Item${cat.productCount === 1 ? '' : 's'}`}
                                   </Badge>
                               </TableCell>
                              <TableCell className="text-right py-6 pr-8" onClick={(e) => e.stopPropagation()}>
                                   <div className="flex items-center justify-end gap-2">
                                     <Button
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 px-2 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                      onClick={() => {
                                        setSelectedCategory(null);
                                        categoryForm.reset({
                                          name: '',
                                          description: '',
                                          parentCategoryId: cat.id
                                        });
                                        setIsCategoryOpen(true);
                                      }}
                                    >
                                      <Plus className="mr-1 h-3 w-3" /> Sub
                                    </Button>
                                    
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                      onClick={() => {
                                        setSelectedCategory(cat);
                                        categoryForm.reset({
                                          name: cat.name,
                                          description: cat.description || '',
                                          parentCategoryId: cat.parentCategoryId || null,
                                        });
                                        setIsCategoryOpen(true);
                                      }}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                      onClick={() => handleDeleteCategoryWithCheck(cat)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                             </TableCell>
                          </TableRow>
                       ))
                     ) : (
                        <TableRow>
                           <TableCell colSpan={4} className="h-64 text-center">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <Package className="h-12 w-12 text-slate-200" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {categoryListSearch ? 'No categories found' : 'No categories mapped'}
                                </p>
                                {categoryListSearch && (
                                  <p className="text-slate-400 text-xs">Try a different search term</p>
                                )}
                              </div>
                           </TableCell>
                        </TableRow>
                     )}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

<TabsContent value="warehouses" className="mt-8 outline-none animate-in fade-in duration-500">
            {!selectedWarehouse ? (
            <Card className="rounded-[2.5rem] border-slate-100 bg-white overflow-hidden shadow-sm">
               <div className="p-4 border-b border-slate-100">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input
                      placeholder="Search warehouses by name, location, contact..."
                      value={warehouseListSearch}
                      onChange={(e) => setWarehouseListSearch(e.target.value)}
                      className="pl-9 h-9 rounded-lg text-xs"
                    />
                  </div>
               </div>
               <Table>
                  <TableHeader className="bg-slate-50/50">
                     <TableRow className="border-b border-slate-100 hover:bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <TableHead className="py-6 pl-8">Warehouse</TableHead>
                        <TableHead className="py-6">Code</TableHead>
                        <TableHead className="py-6">Type</TableHead>
                        <TableHead className="py-6">City</TableHead>
                        <TableHead className="py-6">Status</TableHead>
                        <TableHead className="py-6">Contact</TableHead>
                        <TableHead className="text-right py-6 pr-8">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {warehouses.isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                           <TableRow key={i} className="border-b border-slate-50">
                              <TableCell className="py-6 pl-8"><Skeleton className="h-4 w-32 rounded-full" /></TableCell>
                              <TableCell className="py-6"><Skeleton className="h-4 w-16 rounded-full" /></TableCell>
                              <TableCell className="py-6"><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
                              <TableCell className="py-6"><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                              <TableCell className="py-6"><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
                              <TableCell className="py-6"><Skeleton className="h-4 w-32 rounded-full" /></TableCell>
                              <TableCell className="text-right py-6 pr-8"><Skeleton className="h-8 w-8 ml-auto rounded-xl" /></TableCell>
                           </TableRow>
                        ))
                     ) : filteredWarehouses.length > 0 ? (
                        filteredWarehouses.map((w: any) => {
                          const statusColors: Record<string, string> = {
                            '0': 'bg-emerald-50 text-emerald-600',
                            '1': 'bg-amber-50 text-amber-600',
                            '2': 'bg-slate-100 text-slate-500',
                          };
                          const statusLabels: Record<string, string> = {
                            '0': 'Operational',
                            '1': 'Maintenance',
                            '2': 'Closed',
                          };
                          const typeLabels: Record<string, string> = {
                            '0': 'Godown',
                            '1': 'Store',
                            '2': 'Factory',
                            '3': 'Cold Storage',
                          };
                          return (
                           <TableRow key={w.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedWarehouse(w)}>
                              <TableCell className="font-black text-sm py-6 pl-8 text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{w.name}</TableCell>
                              <TableCell className="text-slate-400 text-[11px] font-mono py-6">{w.code || 'N/A'}</TableCell>
                              <TableCell className="text-slate-500 text-[11px] font-medium py-6">{typeLabels[String(w.type)] || 'Godown'}</TableCell>
                              <TableCell className="text-slate-500 text-[11px] font-medium py-6">{w.city || w.location || 'N/A'}</TableCell>
                              <TableCell className="py-6">
                                 <Badge variant="secondary" className={`border-none text-[9px] font-black uppercase py-1 px-3 rounded-full ${statusColors[String(w.status)] || statusColors['0']}`}>
                                    {statusLabels[String(w.status)] || 'Operational'}
                                 </Badge>
                              </TableCell>
                              <TableCell className="text-slate-500 text-[11px] font-medium py-6">{w.contactPerson || 'N/A'}<br/><span className="text-slate-400">{w.contactPhone || ''}</span></TableCell>
                              <TableCell className="text-right py-6 pr-8">
                                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                    <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                                 </Button>
                              </TableCell>
                           </TableRow>
                          );
                        })
                     ) : (
                          <TableRow>
                             <TableCell colSpan={7} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                  <Warehouse className="h-12 w-12 text-slate-200" />
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      {warehouseListSearch ? 'No warehouses found' : 'No storage hubs mapped'}
                                    </p>
                                    <p className="text-slate-900 text-xs font-bold">
                                      {warehouseListSearch ? 'Try a different search term' : 'Add your first warehouse to start tracking stock across locations.'}
                                    </p>
                                  </div>
                                  {!warehouseListSearch && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest px-6"
                                      onClick={() => setIsWarehouseOpen(true)}
                                    >
                                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Initialize Warehouse
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                           </TableRow>
                      )}
                  </TableBody>
               </Table>
            </Card>
            ) : (
            <Card className="rounded-[2.5rem] border-slate-100 bg-white overflow-hidden shadow-sm animate-in slide-in-from-right duration-500">
               <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedWarehouse(null)} className="rounded-xl h-10 w-10 bg-white border border-slate-100 shadow-sm hover:text-indigo-600 transition-all">
                           <ChevronRight className="h-4 w-4 rotate-180" />
                        </Button>
                        <div>
                           <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">{selectedWarehouse.name}</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedWarehouse.location || 'No operational location set'}</p>
                        </div>
                     </div>
                     {selectedWarehouse.isDefault && (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-none text-[9px] font-black uppercase py-1 px-4 rounded-full">
                           Primary Hub
                        </Badge>
                     )}
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 border-b border-slate-100">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Inventory Depth</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{warehouseStock.length}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Distinct SKUs</span>
                     </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
                     <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total Asset Value</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-indigo-700">{warehouseStock.reduce((sum: number, s: any) => sum + s.currentStock, 0).toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase">Total Qty</span>
                     </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm">
                     <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2">Critical Restock</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-rose-600">{warehouseStock.filter((s: any) => s.currentStock <= 10).length}</span>
                        <span className="text-[10px] font-bold text-rose-400 uppercase">Low Stock</span>
                     </div>
                  </div>
               </div>

               <Table>
                  <TableHeader className="bg-slate-50/50">
                     <TableRow className="border-b border-slate-100 hover:bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <TableHead className="py-5 pl-8">SKU Detail</TableHead>
                        <TableHead className="py-5">Part Number</TableHead>
                        <TableHead className="py-5 text-right font-black">Stock Qty</TableHead>
                        <TableHead className="py-5 text-right pr-8">Audit Status</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {warehouseStockLoading ? (
                        Array(5).fill(0).map((_, i) => (
                           <TableRow key={i}>
                              <TableCell className="pl-8"><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                              <TableCell className="pr-8"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                           </TableRow>
                        ))
                     ) : warehouseStock.length > 0 ? (
                        warehouseStock.map((ws: any) => (
                           <TableRow key={ws.id} className="border-b border-slate-50 hover:bg-slate-50/20 transition-colors">
                              <TableCell className="font-bold text-slate-900 py-5 pl-8 text-sm">{ws.productName}</TableCell>
                              <TableCell className="text-slate-400 text-[11px] font-medium">{ws.product?.sku || '-'}</TableCell>
                              <TableCell className="text-right font-black text-slate-900 py-5">{ws.currentStock}</TableCell>
                              <TableCell className="text-right py-5 pr-8">
                                 {ws.currentStock === 0 ? (
                                    <Badge variant="destructive" className="text-[9px] font-black uppercase rounded-full px-3">OUT OF STOCK</Badge>
                                 ) : ws.currentStock <= (ws.product?.lowStockThreshold || 10) ? (
                                    <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none text-[9px] font-black uppercase rounded-full px-3">CRITICAL LOW</Badge>
                                 ) : (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase rounded-full px-3">NOMINAL</Badge>
                                 )}
                              </TableCell>
                           </TableRow>
                        ))
                     ) : (
                        <TableRow>
                           <TableCell colSpan={4} className="h-48 text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Zero asset distribution in this hub.</p>
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </Card>
            )}
         </TabsContent>

        <TabsContent value="movements" className="mt-8 outline-none animate-in fade-in duration-500">
           <Card className="rounded-[2.5rem] border-slate-100 bg-white overflow-hidden shadow-sm">
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100 hover:bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                       <TableHead className="py-6 pl-8">Transaction Timestamp</TableHead>
                       <TableHead className="py-6">Asset Item</TableHead>
                       <TableHead className="py-6">Operation Type</TableHead>
                       <TableHead className="py-6">Storage Hub</TableHead>
                       <TableHead className="py-6 text-right">Delta Qty</TableHead>
                       <TableHead className="py-6 text-right pr-8">Audit Reference</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {movements.isLoading ? (
                       Array(8).fill(0).map((_, i) => (
                          <TableRow key={i} className="border-b border-slate-50">
                             <TableCell className="py-6 pl-8"><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                             <TableCell className="py-6"><Skeleton className="h-4 w-32 rounded-full" /></TableCell>
                             <TableCell className="py-6"><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                             <TableCell className="py-6"><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                             <TableCell className="py-6"><Skeleton className="h-4 w-12 rounded-full" /></TableCell>
                             <TableCell className="py-6 pr-8 text-right"><Skeleton className="h-4 w-24 ml-auto rounded-full" /></TableCell>
                          </TableRow>
                       ))
                    ) : movementList.length > 0 ? (
                       movementList.map((mv: any) => (
                          <TableRow key={mv.id} className="border-b border-slate-50 hover:bg-slate-50/20 transition-colors">
                             <TableCell className="text-[10px] font-bold text-slate-400 py-6 pl-8 uppercase tracking-tighter">{formatDate(mv.movedAt)}</TableCell>
                             <TableCell className="font-black text-sm py-6 text-slate-900 uppercase tracking-tight">{mv.productName}</TableCell>
                             <TableCell className="py-6">
                                <Badge variant="outline" className={`border-none text-[9px] font-black uppercase py-1 px-3 rounded-full ${mv.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                   {mv.type === 0 ? 'Stock Purchase' : mv.type === 1 ? 'Inventory Out' : mv.type === 2 ? 'Correction' : 'Internal Move'}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-[10px] font-black uppercase py-6 text-slate-600 tracking-wider">
                                <div className="flex items-center gap-1.5">
                                  <Warehouse size={12} className="text-slate-300" />
                                  {mv.warehouseName}
                                </div>
                             </TableCell>
                             <TableCell className={`font-black py-6 text-sm text-right ${mv.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                             </TableCell>
                             <TableCell className="text-[9px] text-slate-400 font-bold py-6 text-right pr-8 uppercase tracking-widest">
                                {mv.referenceType} <span className="text-slate-200">/</span> {mv.referenceId?.substring(0, 8)}
                             </TableCell>
                          </TableRow>
                       ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={6} className="h-64 text-center">
                               <div className="flex flex-col items-center justify-center space-y-3">
                                 <History className="h-12 w-12 text-slate-200" />
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No activity logs recorded</p>
                               </div>
                            </TableCell>
                         </TableRow>
                    )}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="batches" className="mt-8 outline-none animate-in fade-in duration-500">
          <Card className="rounded-[2.5rem] border-slate-100 bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100 hover:bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <TableHead className="py-6 pl-8">Batch Identifier</TableHead>
                  <TableHead className="py-6">Asset Reference</TableHead>
                  <TableHead className="py-6">On-Hand Qty</TableHead>
                  <TableHead className="py-6">Expiration Date</TableHead>
                  <TableHead className="py-6">Storage Mapping</TableHead>
                  <TableHead className="py-6 text-right pr-8">Life Cycle Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchesLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-b border-slate-50">
                      <TableCell colSpan={6} className="py-6 pl-8"><Skeleton className="h-4 w-full rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : batches.length > 0 ? (
                  batches.map((batch: any) => (
                    <TableRow key={batch.id} className="border-b border-slate-50 hover:bg-slate-50/20 transition-colors">
                      <TableCell className="font-black text-sm py-6 pl-8 text-slate-900 uppercase tracking-tighter">{batch.batchNumber}</TableCell>
                      <TableCell className="py-6 text-xs font-bold text-slate-600 uppercase tracking-tight">{batch.productName}</TableCell>
                      <TableCell className="py-6 font-black text-sm text-slate-900">{batch.currentQuantity}</TableCell>
                      <TableCell className="py-6">
                        {batch.expiryDate ? (
                          <span className={`text-[11px] font-black uppercase tracking-tighter ${new Date(batch.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-rose-500' : 'text-slate-500'}`}>
                            {formatDate(batch.expiryDate)}
                          </span>
                        ) : <span className="text-slate-200">N/A</span>}
                      </TableCell>
                      <TableCell className="py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{batch.location || 'Unspecified Zone'}</TableCell>
                      <TableCell className="py-6 text-right pr-8">
                        <Badge variant="outline" className={`border-none text-[9px] font-black uppercase py-1 px-3 rounded-full ${batch.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                          {batch.isActive ? 'In Circulation' : 'Archived'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                       <div className="flex flex-col items-center justify-center space-y-3">
                         <Package className="h-12 w-12 text-slate-200" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active batches tracked</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="mt-8 outline-none animate-in fade-in duration-500">
          <Card className="rounded-[2.5rem] border-slate-100 bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100 hover:bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <TableHead className="py-6 pl-8">Initiated Date</TableHead>
                  <TableHead className="py-6">Transfer Item</TableHead>
                  <TableHead className="py-6">Logistics Route</TableHead>
                  <TableHead className="py-6">Payload Qty</TableHead>
                  <TableHead className="py-6">Status Pipeline</TableHead>
                  <TableHead className="py-6 text-right pr-8">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfersLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-b border-slate-50">
                      <TableCell colSpan={6} className="py-6 pl-8"><Skeleton className="h-4 w-full rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : transfers.length > 0 ? (
                  transfers.map((transfer: any) => (
                    <TableRow key={transfer.id} className="border-b border-slate-50 hover:bg-slate-50/20 transition-colors">
                      <TableCell className="py-6 pl-8 text-[11px] font-black text-slate-400 uppercase tracking-tighter">{formatDate(transfer.transferredAt)}</TableCell>
                      <TableCell className="py-6 font-black text-sm text-slate-900 uppercase tracking-tight">{transfer.productName}</TableCell>
                      <TableCell className="py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                           <span className="text-slate-900">{transfer.fromWarehouseName}</span>
                           <ChevronRight size={12} className="text-slate-200" />
                           <span className="text-indigo-600">{transfer.toWarehouseName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 font-black text-sm text-slate-900">{transfer.quantity}</TableCell>
                      <TableCell className="py-6">
                        <Badge variant="outline" className={`border-none text-[9px] font-black uppercase py-1 px-3 rounded-full ${
                          transfer.status === 0 ? 'bg-amber-50 text-amber-600' :
                          transfer.status === 1 ? 'bg-blue-50 text-blue-600' :
                          transfer.status === 3 ? 'bg-emerald-50 text-emerald-600' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {['Awaiting Approval', 'Authorized', 'In Transit', 'Fulfillment Completed', 'Void'][transfer.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-6 text-right pr-8">
                        {transfer.status === 0 && (
                          <Button size="sm" variant="outline" className="rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white font-black text-[10px] uppercase tracking-widest px-4 h-8" onClick={() => {
                            inventoryApi.approveTransfer(transfer.id).then(() => {
                              inventoryApi.getTransfers().then(r => setTransfers(r?.data || []));
                            });
                          }}>Authorize</Button>
                        )}
                        {transfer.status === 1 && (
                          <Button size="sm" variant="outline" className="rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white font-black text-[10px] uppercase tracking-widest px-4 h-8" onClick={() => {
                            inventoryApi.completeTransfer(transfer.id).then(() => {
                              inventoryApi.getTransfers().then(r => setTransfers(r?.data || []));
                            });
                          }}>Complete</Button>
                        )}
                        {transfer.status > 1 && (
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-300 pointer-events-none">
                              <History size={14} />
                           </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                       <div className="flex flex-col items-center justify-center space-y-3">
                         <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                           <History className="h-6 w-6 text-slate-200" />
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No transfer history discovered</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={isProductOpen} onOpenChange={setIsProductOpen}>
         <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={productForm.handleSubmit(onProductSubmit)}>
               <div className="space-y-4 py-2">
                  <div className="space-y-2">
                     <Label>Product Name *</Label>
                     <Input {...productForm.register('name')} placeholder="e.g. Wireless Mouse" className="rounded-md" />
                     {productErrors.name && <p className="text-[10px] text-destructive font-medium">{String(productErrors.name.message)}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input {...productForm.register('sku')} placeholder="e.g. MS-001" className="rounded-md" />
                     </div>
                     <div className="space-y-2">
                        <Label>Barcode</Label>
                        <Input {...productForm.register('barcode')} placeholder="Scan or enter code" className="rounded-md" />
                     </div>
                  </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label>Category</Label>
                         <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                            <PopoverTrigger asChild>
                               <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between font-bold h-11 rounded-2xl px-5 text-sm border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all shadow-none"
                               >
                                  <span className={productForm.watch('categoryId') ? 'text-slate-900' : 'text-slate-400'}>
                                    {productForm.watch('categoryId')
                                      ? categoriesMap.get(productForm.watch('categoryId')?.toLowerCase() || '') || 'Select Category'
                                      : 'Select Category'}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                               </Button>
                            </PopoverTrigger>
<PopoverContent className="w-[400px] p-0 rounded-[2.5rem] border-slate-100 shadow-2xl bg-white" align="start" sideOffset={8}>
                                 <div className="flex flex-col">
                                     {/* Fixed Search Header */}
                                     <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex-shrink-0">
                                        <div className="relative">
                                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                           <Input
                                              placeholder="Search categories..."
                                              value={categorySearch}
                                              onChange={(e) => setCategorySearch(e.target.value)}
                                              className="pl-11 h-11 rounded-2xl border-white bg-white shadow-sm focus-visible:ring-indigo-500 font-medium text-sm"
                                              autoFocus
                                           />
                                        </div>
                                     </div>
                                     
                                     {/* HARD SCROLL VIEWPORT */}
                                     <div 
                                       className="overflow-y-auto py-3 px-2 text-slate-900 bg-white touch-auto" 
                                       style={{ maxHeight: '300px', overflowY: 'auto' }}
                                       onWheel={(e) => e.stopPropagation()}
                                     >
                                    {filteredCategories.length === 0 ? (
                                       <div className="py-12 text-center">
                                         <Package className="mx-auto h-12 w-12 text-slate-200 opacity-20 mb-3" />
                                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory structure is empty</p>
                                       </div>
                                    ) : (
                                       filteredCategories.map((c: any) => {
                                          const isSelected = productForm.watch('categoryId') === c.id;
                                          const isExpanded = categoryExpanded.has(c.id);
                                          return (
                                             <div
                                                key={c.id}
                                                className={`flex items-center px-4 py-3 cursor-pointer rounded-2xl transition-all group mb-1 ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50'}`}
                                                style={{ marginLeft: `${c.depth * 28}px` }}
                                                onClick={() => {
                                                   productForm.setValue('categoryId', c.id);
                                                   setCategoryPopoverOpen(false);
                                                   setCategorySearch('');
                                                }}
                                             >
                                                <div className="mr-2 flex items-center justify-center">
                                                   {c.hasChildren ? (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          toggleCategoryExpand(c.id);
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-black/5 rounded cursor-pointer"
                                                      >
                                                        {isExpanded ? '📂' : '📁'}
                                                      </button>
                                                   ) : (
                                                      <span className="w-8 h-8 flex items-center justify-center text-sm">📄</span>
                                                   )}
                                                </div>
                                                
                                                <div className={`mr-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-slate-300'}`}>
                                                   {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                                </div>
                                                
                                                <div className="flex flex-col flex-1 truncate">
                                                   <span className={`text-sm tracking-tight ${isSelected ? 'font-black' : 'font-bold text-slate-700 leading-tight'}`}>{c.name}</span>
                                                   <span className={`text-[10px] ${isSelected ? 'text-indigo-200 font-medium' : 'text-slate-400 font-bold uppercase tracking-wider'}`}>
                                                     {c.hasChildren 
                                                       ? `${c.subCategories?.length || 0} sub-categor${c.subCategories?.length === 1 ? 'y' : 'ies'}`
                                                       : `${c.productCount || 0} SKU Item${c.productCount === 1 ? '' : 's'}`}
                                                   </span>
                                                </div>

                                                {isSelected && (
                                                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                                                  </div>
                                                )}
                                             </div>
                                          );
                                       })
                                    )}
                                  </div>
                                 </div>
                             </PopoverContent>
                         </Popover>
                      </div>
                     <div className="space-y-2">
                        <Label>Unit *</Label>
                        <Select value={productForm.watch('unit')} onValueChange={(v) => productForm.setValue('unit', v)}>
                           <SelectTrigger className="rounded-md">
                              <SelectValue placeholder="Select Unit" />
                           </SelectTrigger>
                           <SelectContent position="popper" sideOffset={4}>
                              <SelectItem value="pcs">Pcs</SelectItem>
                              <SelectItem value="kg">Kg</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                           </SelectContent>
                        </Select>
                        {productErrors.unit && <p className="text-[10px] text-destructive font-medium">{String(productErrors.unit.message)}</p>}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Cost Price</Label>
                        <NumberInput step="0.01" onValueChange={(v) => productForm.setValue('costPrice', v)} {...productForm.register('costPrice', { valueAsNumber: true })} className="rounded-md" />
                        {productErrors.costPrice && <p className="text-[10px] text-destructive font-medium">{String(productErrors.costPrice.message)}</p>}
                     </div>
                     <div className="space-y-2">
                        <Label>Selling Price</Label>
                        <NumberInput step="0.01" onValueChange={(v) => productForm.setValue('sellingPrice', v)} {...productForm.register('sellingPrice', { valueAsNumber: true })} className="rounded-md" />
                        {productErrors.sellingPrice && <p className="text-[10px] text-destructive font-medium">{String(productErrors.sellingPrice.message)}</p>}
                                    {(productForm.watch('sellingPrice') || 0) > 0 && (productForm.watch('costPrice') || 0) > 0 && (
                                       <p className="text-xs text-muted-foreground">
                                          Margin: {(((productForm.watch('sellingPrice') - productForm.watch('costPrice')) / productForm.watch('costPrice')) * 100).toFixed(1)}% (NPR {(productForm.watch('sellingPrice') - productForm.watch('costPrice')).toFixed(2)} per unit)
                                       </p>
                                    )}
                     </div>
                  </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label>Brand</Label>
                                 <Input {...productForm.register('brand')} placeholder="e.g. Himalayan, Wai Wai" />
                              </div>
                              <div className="space-y-2">
                                 <Label>HSN/SAC Code</Label>
                                 <Input {...productForm.register('hsnCode')} placeholder="For tax classification" />
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label>Reorder Quantity</Label>
                                 <NumberInput onValueChange={(v) => productForm.setValue('reorderQuantity', v)} {...productForm.register('reorderQuantity', { valueAsNumber: true })} />
                                 <p className="text-[10px] text-muted-foreground">System alerts when stock reaches low threshold.</p>
                              </div>
                              <div className="space-y-2 pt-5">
                                 <div className="flex items-center gap-2">
                                    <Switch checked={productForm.watch('isVatApplicable')} onCheckedChange={(v) => productForm.setValue('isVatApplicable', v)} />
                                    <Label>VAT 13% applicable</Label>
                                 </div>
                                 <div className="flex items-center gap-2 mt-3">
                                    <Switch checked={productForm.watch('trackExpiry')} onCheckedChange={(v) => productForm.setValue('trackExpiry', v)} />
                                    <Label>Track Expiry</Label>
                                 </div>
                              </div>
                           </div>

{productForm.watch('trackExpiry') && (
                              <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                                 <div className="flex items-center justify-between">
                                    <Label className="font-medium text-base">Batches</Label>
                                    <Button
                                       type="button"
                                       size="sm"
                                       variant="outline"
                                       onClick={() => {
                                          setEditingBatch(null);
                                          setIsBatchFormOpen(true);
                                       }}
                                       className="h-8"
                                    >
                                       <Plus className="h-4 w-4 mr-1" /> Add Batch
                                    </Button>
                                 </div>

                                 {batches.length > 0 && (
                                    <Table>
                                       <TableHeader>
                                          <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs">
                                             <TableHead className="py-3">Warehouse</TableHead>
                                             <TableHead className="py-3">Batch #</TableHead>
                                             <TableHead className="py-3">Mfg Date</TableHead>
                                             <TableHead className="py-3">Expiry Date</TableHead>
                                             <TableHead className="py-3 text-right">Qty</TableHead>
                                             <TableHead className="py-3 text-right">Actions</TableHead>
                                          </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                          {batches.map((batch: any, idx: number) => (
                                             <TableRow key={batch.id || idx} className="border-b border-slate-100/30">
                                                <TableCell className="py-2 text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                  {warehouseList.find((w: any) => w.id === batch.warehouseId)?.name || 'Unknown'}
                                                </TableCell>
                                                <TableCell className="py-2 font-medium">{batch.batchNumber || 'Auto'}</TableCell>
                                                <TableCell className="py-2">{batch.manufactureDate ? formatDate(batch.manufactureDate) : '-'}</TableCell>
                                                <TableCell className="py-2">{batch.expiryDate ? formatDate(batch.expiryDate) : '-'}</TableCell>
                                                <TableCell className="py-2 text-right font-medium">{batch.initialQuantity}</TableCell>
                                                <TableCell className="py-2 text-right">
                                                   <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-7 w-7 p-0"
                                                      onClick={() => {
                                                         setEditingBatch(batch);
                                                         setIsBatchFormOpen(true);
                                                      }}
                                                   >
                                                      <Edit2 className="h-3 w-3" />
                                                   </Button>
                                                   <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                                                      onClick={() => handleDeleteBatch(idx)}
                                                   >
                                                      <Trash2 className="h-3 w-3" />
                                                   </Button>
                                                </TableCell>
                                             </TableRow>
                                          ))}
                                       </TableBody>
                                    </Table>
                                 )}

                                 {batches.length === 0 && !isBatchFormOpen && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                       No batches added. Click "Add Batch" to add batches for this product.
                                    </p>
                                 )}

                                 {isBatchFormOpen && (
                                     <BatchForm
                                        batch={editingBatch}
                                        onSave={handleSaveBatch}
                                        onCancel={() => {
                                           setIsBatchFormOpen(false);
                                           setEditingBatch(null);
                                        }}
                                        isSubmitting={isSubmitting}
                                        warehouses={warehouseList}
                                     />
                                 )}
                              </div>
                           )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label>Low Stock Threshold</Label>
                         <NumberInput onValueChange={(v) => productForm.setValue('lowStockThreshold', v)} {...productForm.register('lowStockThreshold', { valueAsNumber: true })} className="rounded-md" />
                      </div>
                    </div>

                    {!selectedProduct && (
                      <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Initial Stock by Warehouse</h3>
                          <span className="text-xs text-muted-foreground">Select warehouses and enter opening stock</span>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                          <Input
                            placeholder="Filter warehouses..."
                            value={stockWarehouseSearch}
                            onChange={(e) => setStockWarehouseSearch(e.target.value)}
                            className="pl-7 h-8 text-xs"
                          />
                        </div>
                        {filteredWarehousesForStock.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No warehouses found</p>
                        ) : (
                          <div className="space-y-3">
                            {filteredWarehousesForStock.map((warehouse: any) => {
                              const entry = stockEntries.find((e: any) => e.warehouseId === warehouse.id);
                              const isSelected = !!entry;
                              const currentStock = entry?.openingStock ?? 0;
                              const handleStockChange = (numValue: number) => {
                                if (numValue > 0 && !isSelected) {
                                  setStockEntries((prev: any[]) => [...prev, { warehouseId: warehouse.id, openingStock: numValue, batchNumber: '', expiryDate: '', manufactureDate: '' }]);
                                } else if (numValue > 0 && isSelected) {
                                  setStockEntries((prev: any[]) => prev.map((e: any) => e.warehouseId === warehouse.id ? { ...e, openingStock: numValue } : e));
                                } else {
                                  setStockEntries((prev: any[]) => prev.filter((e: any) => e.warehouseId !== warehouse.id));
                                }
                              };
                              const handleBatchChange = (field: string, value: string) => {
                                if (!isSelected) {
                                  setStockEntries((prev: any[]) => [...prev, { warehouseId: warehouse.id, openingStock: currentStock, batchNumber: field === 'batchNumber' ? value : '', expiryDate: field === 'expiryDate' ? value : '', manufactureDate: field === 'manufactureDate' ? value : '' }]);
                                } else {
                                  setStockEntries((prev: any[]) => prev.map((e: any) => e.warehouseId === warehouse.id ? { ...e, [field]: value } : e));
                                }
                              };
                              return (
                                <div key={warehouse.id} className="flex items-center gap-3 p-3 bg-white rounded border">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked && currentStock === 0) {
                                        setStockEntries((prev: any[]) => [...prev, { warehouseId: warehouse.id, openingStock: 0, batchNumber: '', expiryDate: '', manufactureDate: '' }]);
                                      } else {
                                        setStockEntries((prev: any[]) => prev.filter((en: any) => en.warehouseId !== warehouse.id));
                                      }
                                    }}
                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{warehouse.name}</p>
                                    <p className="text-xs text-muted-foreground">{warehouse.code || 'No code'} • {warehouse.city || warehouse.location || 'No location'}</p>
                                  </div>
                                  <div className="w-24">
                                    <NumberInput
                                      placeholder="Stock"
                                      value={currentStock}
                                      onValueChange={handleStockChange}
                                      className="h-8"
                                    />
                                  </div>
                                  {productForm.watch('trackExpiry') && isSelected && (
                                    <>
                                      <div className="w-28">
                                        <Input
                                          placeholder="Batch #"
                                          value={entry?.batchNumber || ''}
                                          onChange={(e) => handleBatchChange('batchNumber', e.target.value)}
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="w-36">
                                        <Input
                                          type="date"
                                          placeholder="Expiry"
                                          value={entry?.expiryDate || ''}
                                          onChange={(e) => handleBatchChange('expiryDate', e.target.value)}
                                          className="h-8"
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
               </div>

               <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsProductOpen(false)}>
                     Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {selectedProduct ? 'Saving...' : 'Adding...'}</>
                     ) : (
                        <>{selectedProduct ? 'Save Changes' : '+ Add Product'}</>
                     )}
                  </Button>
               </DialogFooter>
             </form>
          </DialogContent>
        </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryOpen} onOpenChange={(open) => {
        setIsCategoryOpen(open);
        if (!open) setSelectedCategory(null);
      }}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
<form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                   <Label>Name</Label>
                   <Input {...categoryForm.register('name')} placeholder="e.g. Electronics" />
                </div>
                <div className="space-y-2">
                   <Label>Description</Label>
                   <Textarea {...categoryForm.register('description')} rows={3} />
                </div>
<div className="space-y-2">
                   <Label>Parent Category (Optional)</Label>
                   <Select
                     value={categoryForm.watch('parentCategoryId') || '__none__'}
                     onValueChange={(v) => categoryForm.setValue('parentCategoryId', v === '__none__' ? null : v)}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Select parent category" />
                     </SelectTrigger>
                     <SelectContent className="max-h-[300px] overflow-auto">
                        <SelectItem value="__none__" className="font-bold text-slate-400">-- No Parent --</SelectItem>
                        {allCategoriesFlat
                          .filter((c: any) => c.id !== selectedCategory?.id)
                          .map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex items-center" style={{ marginLeft: `${c.depth * 16}px` }}>
                                {c.depth > 0 && <span className="mr-2 text-slate-300">↳</span>}
                                <span className={c.depth === 0 ? 'font-bold' : 'font-medium text-slate-600'}>{c.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                   </Select>
                </div>
                 <DialogFooter>
                   <Button type="button" variant="outline" onClick={() => {
                     setIsCategoryOpen(false);
                     setSelectedCategory(null);
                   }}>Cancel</Button>
                   <Button type="submit" disabled={isSubmitting}>{selectedCategory ? 'Update' : 'Save'}</Button>
                </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Stock Adjustment</DialogTitle>
            </DialogHeader>
            <form onSubmit={adjustForm.handleSubmit(onAdjustSubmit)} className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label>Select Product</Label>
                   <Select onValueChange={(v) => adjustForm.setValue('productId', v)}>
                    <SelectTrigger>
                       <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                        {productList.map((p: any) => (
                           <SelectItem key={p.id} value={p.id}>{p.name} (In Stock: {p.currentStock})</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Correction Type</Label>
                      <Select onValueChange={(v) => adjustForm.setValue('type', parseInt(v))}>
                        <SelectTrigger>
                           <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="0">Stock In</SelectItem>
                           <SelectItem value="1">Stock Out</SelectItem>
                           <SelectItem value="2">Adjustment</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label>Quantity</Label>
                     <NumberInput step="0.01" {...adjustForm.register('quantity', { valueAsNumber: true })} />
                  </div>
               </div>
               <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Select onValueChange={(v) => adjustForm.setValue('warehouseId', v)}>
                    <SelectTrigger>
                       <SelectValue placeholder="Select Warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                       {warehouseList.map((w: any) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
               </div>
                <DialogFooter>
                   <Button type="button" variant="outline" onClick={() => setIsAdjustmentOpen(false)}>Cancel</Button>
                   <Button type="submit" disabled={isSubmitting}>Save Adjustment</Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      {/* Warehouse Dialog */}
      <Dialog open={isWarehouseOpen} onOpenChange={setIsWarehouseOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Warehouse</DialogTitle>
          </DialogHeader>
          <form onSubmit={warehouseForm.handleSubmit(onWarehouseSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warehouse Name *</Label>
                  <Input placeholder="e.g. Main Warehouse" {...warehouseForm.register('name')} />
                  {warehouseForm.formState.errors.name && (
                    <p className="text-[10px] text-destructive">{warehouseForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Warehouse Code</Label>
                  <Input placeholder="Auto-generated" {...warehouseForm.register('code')} disabled className="bg-muted" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select onValueChange={(v) => warehouseForm.setValue('type', parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Godown</SelectItem>
                      <SelectItem value="1">Store</SelectItem>
                      <SelectItem value="2">Factory</SelectItem>
                      <SelectItem value="3">Cold Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select onValueChange={(v) => warehouseForm.setValue('status', parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Operational</SelectItem>
                      <SelectItem value="1">Maintenance</SelectItem>
                      <SelectItem value="2">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Location</h3>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input placeholder="Street address" {...warehouseForm.register('address')} />
                {warehouseForm.formState.errors.address && (
                  <p className="text-[10px] text-destructive">{warehouseForm.formState.errors.address.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input placeholder="e.g. Kathmandu" {...warehouseForm.register('city')} />
                  {warehouseForm.formState.errors.city && (
                    <p className="text-[10px] text-destructive">{warehouseForm.formState.errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input placeholder="e.g. Kathmandu" {...warehouseForm.register('district')} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input placeholder="Manager name" {...warehouseForm.register('contactPerson')} />
                  {warehouseForm.formState.errors.contactPerson && (
                    <p className="text-[10px] text-destructive">{warehouseForm.formState.errors.contactPerson.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input placeholder="9841234567" {...warehouseForm.register('contactPhone')} />
                  {warehouseForm.formState.errors.contactPhone && (
                    <p className="text-[10px] text-destructive">{warehouseForm.formState.errors.contactPhone.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Settings</h3>
              <div className="flex items-center gap-3">
                <Switch checked={warehouseForm.watch('isDefault')} onCheckedChange={(v) => warehouseForm.setValue('isDefault', v)} />
                <Label>Set as default warehouse</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={warehouseForm.watch('allowNegativeStock')} onCheckedChange={(v) => warehouseForm.setValue('allowNegativeStock', v)} />
                <Label>Allow negative stock</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={warehouseForm.watch('isActive')} onCheckedChange={(v) => warehouseForm.setValue('isActive', v)} />
                <Label>Active (visible in lists)</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => setIsWarehouseOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Saving...</> : 'Add Warehouse'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Stock Transfer</DialogTitle>
          </DialogHeader>
          <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Transfer Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Transfer Type</Label>
                  <Select onValueChange={(v) => transferForm.setValue('type', parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Internal</SelectItem>
                      <SelectItem value="1">Customer</SelectItem>
                      <SelectItem value="2">Return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <Select onValueChange={(v) => transferForm.setValue('priority', parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="Select Priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="1">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Expected Delivery</Label>
                <Input type="date" {...transferForm.register('expectedDeliveryDate')} className="h-9" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Product & Batch</h3>
              <div className="space-y-1">
                <Label>Product *</Label>
                <Select onValueChange={(v) => {
                  transferForm.setValue('productId', v);
                  const prod = productList.find((p: any) => p.id === v);
                  setSelectedTransferProduct(prod);
                  if (prod?.trackExpiry) {
                    inventoryApi.getBatches(v).then(r => {
                      setTransferProductBatches(r?.data || []);
                    });
                  } else {
                    setTransferProductBatches([]);
                    setTransferByBatch(false);
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                  <SelectContent>
                    {productList.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTransferProduct?.trackExpiry && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="transferByBatch"
                      checked={transferByBatch}
                      onChange={(e) => setTransferByBatch(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="transferByBatch">Transfer by Batch</Label>
                  </div>
                  {transferByBatch && (
                    <Select onValueChange={(v) => transferForm.setValue('batchId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger>
                      <SelectContent>
                        {transferProductBatches.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.batchNumber} - Exp: {formatDate(b.expiryDate)} - Qty: {b.currentQuantity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label>Quantity *</Label>
                <NumberInput {...transferForm.register('quantity', { valueAsNumber: true })} className="h-9" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Warehouses</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>From Warehouse *</Label>
                  <Select onValueChange={(v) => transferForm.setValue('fromWarehouseId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {warehouseList.map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>To Warehouse *</Label>
                  <Select onValueChange={(v) => transferForm.setValue('toWarehouseId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {warehouseList.map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Approval</h3>
              <div className="space-y-1">
                <Label>Reason</Label>
                <Select onValueChange={(v) => transferForm.setValue('reason', parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Select Reason" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Restocking</SelectItem>
                    <SelectItem value="1">Customer Order</SelectItem>
                    <SelectItem value="2">Damage</SelectItem>
                    <SelectItem value="3">Consolidation</SelectItem>
                    <SelectItem value="4">Quality Check</SelectItem>
                    <SelectItem value="5">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  {...transferForm.register('requiresApproval')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="requiresApproval">Requires Approval</Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Shipping (Optional)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Shipping Cost</Label>
                  <NumberInput {...transferForm.register('shippingCost', { valueAsNumber: true })} step="0.01" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label>Tracking #</Label>
                  <Input {...transferForm.register('trackingNumber')} placeholder="Optional" className="h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea {...transferForm.register('notes')} placeholder="Optional notes..." className="rounded-md" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Create Transfer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-slate-100 bg-white p-8">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <DialogTitle className="text-center text-xl font-black text-slate-900 leading-tight">
              Safe Deletion Protocol
            </DialogTitle>
            <p className="text-center text-slate-500 text-sm font-medium mt-2">
              The category <span className="text-slate-900 font-bold">"{categoryToDelete?.name}"</span> contains <span className="text-rose-600 font-bold">{categoryToDelete?.productCount} products</span>.
              To prevent data loss, please move these products to another category before archiving this entity.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Category for Transition</Label>
              <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-bold h-12 rounded-2xl px-6 text-sm border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all"
                  >
                    {targetCategoryIdForDelete
                      ? filteredCategories.find((c: any) => c.id === targetCategoryIdForDelete)?.name || 'Select Target Category'
                      : 'Select Target Category'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-2xl border-slate-100 shadow-2xl overflow-y-auto max-h-[300px]" align="start">
                  <div className="p-3 border-b border-slate-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <Input
                        placeholder="Search target category..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-xl border-slate-50 bg-slate-50 focus-visible:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-auto py-2">
                    {filteredCategories.filter(c => c.id !== categoryToDelete?.id).length === 0 ? (
                      <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">No available targets</div>
                    ) : (
                      filteredCategories
                        .filter(c => c.id !== categoryToDelete?.id)
                        .map((c: any) => (
                          <div
                            key={c.id}
                            className={`flex items-center px-5 py-3 cursor-pointer hover:bg-indigo-50/50 transition-colors group ${targetCategoryIdForDelete === c.id ? 'bg-indigo-50' : ''}`}
                            style={{ paddingLeft: `${20 + (c.depth * 20)}px` }}
                            onClick={() => {
                              setTargetCategoryIdForDelete(c.id);
                              setCategoryPopoverOpen(false);
                            }}
                          >
                            <div className={`mr-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${targetCategoryIdForDelete === c.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                              {targetCategoryIdForDelete === c.id && <div className="w-1 h-1 rounded-full bg-white" />}
                            </div>
                            <span className={`text-xs ${targetCategoryIdForDelete === c.id ? 'font-bold text-indigo-700' : 'font-medium text-slate-600'}`}>{c.name}</span>
                          </div>
                        ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-2xl font-bold text-slate-500 hover:bg-slate-50">Discard</Button>
            <Button 
              onClick={onConfirmDeleteCategory} 
              disabled={isSubmitting || !targetCategoryIdForDelete}
              className="rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 shadow-lg shadow-rose-200"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Migration & Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductDetailDrawer
        product={detailProduct}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(p) => {
          setIsDetailOpen(false);
          handleEditProduct(p);
        }}
      />

      {/* Category Products Modal */}
      <Dialog open={showCategoryProducts} onOpenChange={setShowCategoryProducts}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Products in "{selectedCategoryForProducts?.name}"</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {(() => {
              const getAllSubCategoryIds = (catId: string | null): string[] => {
                if (!catId) return [];
                const targetId = catId.toLowerCase();
                const ids = [targetId];
                const subCats = allCategoriesFlat.filter(c => c.parentCategoryId?.toLowerCase() === targetId);
                subCats.forEach(sc => {
                  if (sc.id.toLowerCase() !== targetId) {
                    ids.push(...getAllSubCategoryIds(sc.id));
                  }
                });
                return ids;
              };
              
              const relevantIds = selectedCategoryForProducts ? getAllSubCategoryIds(selectedCategoryForProducts.id) : [];
              const categoryProducts = fullProductList.filter((p: any) => 
                p.categoryId && relevantIds.includes(p.categoryId.toLowerCase())
              );

              if (categoryProducts.length === 0) {
                return (
                  <div className="py-16 text-center text-slate-400">
                    <div className="flex justify-center mb-6 opacity-20">
                      <div className="relative">
                        <Package className="h-16 w-16" />
                        <div className="absolute -right-2 -top-2 bg-rose-500 w-6 h-6 rounded-full border-4 border-white" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Zero Assets Found</p>
                    <p className="text-[10px] text-slate-300 max-w-[200px] mx-auto leading-relaxed">The selected hierarchy contains no products in the current inventory scope</p>
                  </div>
                );
              }

              return (
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-transparent border-slate-100">
                      <TableHead className="py-4">Product Specs</TableHead>
                      <TableHead className="py-4">Identifier (SKU)</TableHead>
                      <TableHead className="py-4 text-right">Volume</TableHead>
                      <TableHead className="py-4 text-right">MSRP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryProducts.map((product: any) => (
                      <TableRow 
                        key={product.id} 
                        className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-50"
                        onClick={() => {
                          setShowCategoryProducts(false);
                          handleEditProduct(product);
                        }}
                      >
                        <TableCell className="py-4">
                          <span className="font-black text-slate-900 text-sm tracking-tight">{product.name}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">{product.sku}</span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <Badge variant={product.currentStock <= product.lowStockThreshold ? 'destructive' : 'secondary'} className="rounded-full font-black text-[10px]">
                            {product.currentStock} {product.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-right font-black text-slate-700 text-sm">
                          {formatCurrency(product.sellingPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
