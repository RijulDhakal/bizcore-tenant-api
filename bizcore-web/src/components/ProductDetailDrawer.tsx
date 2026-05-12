import { useEffect, useState } from 'react';
import { X, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { inventoryApi } from '../api/inventory.api';
import { formatCurrency, formatDate } from '../utils/format';

interface ProductDetailDrawerProps {
  product: any;
  open: boolean;
  onClose: () => void;
  onEdit: (product: any) => void;
}

export function ProductDetailDrawer({ product, open, onClose, onEdit }: ProductDetailDrawerProps) {
  const [stockData, setStockData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    if (open && product?.id) {
      Promise.all([
        inventoryApi.getProductStock(product.id),
        inventoryApi.getBatches(product.id),
        inventoryApi.getMovements({ productId: product.id })
      ]).then(([stock, batchData, movementData]) => {
        setStockData(stock?.data);
        setBatches(batchData?.data || []);
        setMovements((movementData?.data || []).slice(0, 5));
      });
    }
  }, [open, product]);

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return { label: 'Expired', color: 'text-red-600', bg: 'bg-red-100' };
    if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-[500px] bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">{product.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{product.sku || 'No SKU'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 font-bold text-xs" onClick={() => onEdit(product)}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Stock</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{stockData?.totalStock || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{product.unit || 'pcs'}</span>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 shadow-sm">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Available</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-indigo-600">{stockData?.totalStock || 0}</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{product.unit || 'pcs'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Specifications</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                <span className="font-bold text-slate-900">{product.categoryName || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit of Measure</span>
                <span className="font-bold text-slate-900">{product.unit}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selling Price</span>
                <span className="font-bold text-indigo-600 text-sm">{formatCurrency(product.sellingPrice)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost Price</span>
                <span className="font-bold text-slate-900">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Track Expiry</span>
                <span className="font-bold text-slate-900">{product.trackExpiry ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
                <Badge className={`w-fit py-0 text-[9px] font-black uppercase ${product.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`} variant="outline">
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="stock" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-slate-100/80 p-1 rounded-xl">
              <TabsTrigger value="stock" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Stock</TabsTrigger>
              <TabsTrigger value="batches" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Batches</TabsTrigger>
              <TabsTrigger value="movements" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Movements</TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="mt-6 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Warehouse</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest py-3">Stock</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest py-3">Reserved</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest py-3">Avail.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockData?.stockByWarehouse?.map((ws: any) => (
                    <TableRow key={ws.warehouseId} className="border-slate-50">
                      <TableCell className="text-xs font-bold text-slate-900">{ws.warehouseName}</TableCell>
                      <TableCell className="text-right text-xs font-black text-slate-900">{ws.quantityInStock}</TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-400">{ws.reservedQuantity}</TableCell>
                      <TableCell className="text-right text-xs font-black text-indigo-600">{ws.availableQuantity}</TableCell>
                    </TableRow>
                  ))}
                  {(!stockData?.stockByWarehouse || stockData.stockByWarehouse.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No local stock data</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="batches" className="mt-6 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Batch Number</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Expiry Date</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest py-3">Quantity</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest py-3">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch: any) => {
                    const status = getExpiryStatus(batch.expiryDate);
                    return (
                      <TableRow key={batch.id} className="border-slate-50">
                        <TableCell className="text-xs font-bold text-slate-900">{batch.batchNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDate(batch.expiryDate)}</TableCell>
                        <TableCell className="text-right text-xs font-black text-slate-900">{batch.currentQuantity}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={`${status.bg} border-0 py-0 text-[10px] font-black uppercase`} variant="outline">
                            <span className={status.color}>{status.label}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {batches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active batches</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="movements" className="mt-6 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Entry Date</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Activity Type</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest py-3">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mv: any) => (
                    <TableRow key={mv.id} className="border-slate-50">
                      <TableCell className="text-xs text-slate-600">{formatDate(mv.movedAt)}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 uppercase tracking-tighter">
                        {mv.type === 0 ? 'Stock Purchase' : mv.type === 1 ? 'Sale Return' : 'Internal Transfer'}
                      </TableCell>
                      <TableCell className={`text-right text-xs font-black ${mv.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {mv.quantity > 0 ? '+' : ''}{mv.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent transaction history</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
