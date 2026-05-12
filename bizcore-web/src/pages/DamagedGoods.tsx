import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '../api/axiosInstance'
import { formatNPR } from '../utils/nepali'
import { usePermissions } from '../hooks/usePermissions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'

type DamagedGoodsRow = {
  id: string
  productId: string
  productName: string
  warehouseName: string
  quantity: number
  estimatedLoss: number
  reason: string
  damageType: string
  reportedDate: string
  reportedBy: string
  status: string
}

export default function DamagedGoods() {
  const { can, isOwnerOrAdmin } = usePermissions()
  const [rows, setRows] = useState<DamagedGoodsRow[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [open, setOpen] = useState(false)

  const [form, setForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: 1,
    damageType: 'Broken',
    reason: '',
    estimatedLoss: 0,
    reportedDate: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      if (status !== 'all') params.status = status

      const [listRes, summaryRes, productRes, warehouseRes] = await Promise.all([
        api.get('/damaged-goods', { params }),
        api.get('/damaged-goods/summary'),
        api.get('/inventory/products'),
        api.get('/inventory/warehouses'),
      ])

      setRows(listRes.data?.data ?? [])
      setSummary(summaryRes.data?.data ?? null)
      setProducts(productRes.data?.data ?? [])
      setWarehouses(warehouseRes.data?.data ?? [])
    } catch {
      toast.error('Failed to load damaged goods data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [status, dateFrom, dateTo])

  const mostAffected = useMemo(() => summary?.mostAffectedProduct ?? 'N/A', [summary])

  const submit = async () => {
    try {
      await api.post('/damaged-goods', {
        productId: form.productId,
        warehouseId: form.warehouseId,
        quantity: Number(form.quantity),
        estimatedLoss: Number(form.estimatedLoss),
        reason: form.reason,
        damageType: form.damageType,
        reportedDate: form.reportedDate,
        notes: form.notes || null,
      })
      toast.success('Damaged goods report submitted')
      setOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to submit report')
    }
  }

  const approve = async (id: string) => {
    await api.put(`/damaged-goods/${id}/approve`)
    toast.success('Report approved')
    await load()
  }

  const writeOff = async (id: string) => {
    await api.put(`/damaged-goods/${id}/write-off`)
    toast.success('Damage written off')
    await load()
  }

  const remove = async (id: string) => {
    await api.delete(`/damaged-goods/${id}`)
    toast.success('Report deleted')
    await load()
  }

  const badgeClass = (value: string) => {
    const lower = value.toLowerCase()
    if (lower === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (lower === 'approved') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (lower === 'writtenoff' || lower === 'written off') return 'bg-slate-100 text-slate-700 border-slate-200'
    if (lower === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Damaged Goods</h1>
          <p className="text-sm text-muted-foreground">Track damaged inventory and write-off workflow.</p>
        </div>
        {can('manageDamagedGoods') && (
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm" onClick={() => setOpen(true)}>
            <Plus size={16} /> Report Damage
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Loss This Month" value={formatNPR(Number(summary?.totalLossThisMonth ?? 0))} icon={<AlertTriangle size={16} />} tone="rose" />
        <SummaryCard label="Pending Approvals" value={String(summary?.pendingCount ?? 0)} icon={<ClipboardList size={16} />} tone="amber" />
        <SummaryCard label="Written Off" value={String(summary?.writtenOffCount ?? 0)} icon={<CheckCircle2 size={16} />} tone="slate" />
        <SummaryCard label="Most Affected Product" value={mostAffected} icon={<AlertTriangle size={16} />} tone="blue" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="WrittenOff">Written Off</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button onClick={() => void load()} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">Refresh</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-slate-500">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Qty</th>
              <th className="text-left px-4 py-3">Damage Type</th>
              <th className="text-left px-4 py-3">Est. Loss</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Reported By</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No records found.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{new Date(row.reportedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">{row.productName}</td>
                <td className="px-4 py-3">{row.quantity}</td>
                <td className="px-4 py-3">{row.damageType}</td>
                <td className="px-4 py-3 text-rose-700 font-medium">{formatNPR(Number(row.estimatedLoss))}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${badgeClass(row.status)}`}>{row.status}</span>
                </td>
                <td className="px-4 py-3">{row.reportedBy}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {isOwnerOrAdmin && row.status.toLowerCase() === 'pending' && (
                      <button className="px-2 py-1 border rounded text-xs" onClick={() => void approve(row.id)}>Approve</button>
                    )}
                    {isOwnerOrAdmin && row.status.toLowerCase() === 'approved' && (
                      <button className="px-2 py-1 border rounded text-xs" onClick={() => void writeOff(row.id)}>Write Off</button>
                    )}
                    {isOwnerOrAdmin && row.status.toLowerCase() === 'pending' && (
                      <button className="px-2 py-1 border rounded text-xs text-rose-700 inline-flex items-center gap-1" onClick={() => void remove(row.id)}>
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Damage</DialogTitle>
            <DialogDescription>Create a damaged inventory report.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.productId} onChange={(e) => setForm((v) => ({ ...v, productId: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select Product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={form.warehouseId} onChange={(e) => setForm((v) => ({ ...v, warehouseId: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="number" min={1} value={form.quantity} onChange={(e) => setForm((v) => ({ ...v, quantity: Number(e.target.value) }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Quantity" />
            <select value={form.damageType} onChange={(e) => setForm((v) => ({ ...v, damageType: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              {['Expired', 'Broken', 'Water Damage', 'Theft', 'Fire', 'Other'].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input type="number" min={0} step="0.01" value={form.estimatedLoss} onChange={(e) => setForm((v) => ({ ...v, estimatedLoss: Number(e.target.value) }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Estimated Loss (NPR)" />
            <input type="date" value={form.reportedDate} onChange={(e) => setForm((v) => ({ ...v, reportedDate: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input value={form.reason} onChange={(e) => setForm((v) => ({ ...v, reason: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="Reason" />
            <textarea value={form.notes} onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="Notes" rows={3} />
          </div>

          <DialogFooter>
            <button className="px-3 py-2 text-sm border border-slate-200 rounded-lg" onClick={() => setOpen(false)}>Cancel</button>
            <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg" onClick={() => void submit()}>Submit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'rose' | 'amber' | 'slate' | 'blue'
}) {
  const toneClass: Record<string, string> = {
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  }

  return (
    <div className={`rounded-xl border p-4 ${toneClass[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span>{icon}</span>
      </div>
      <div className="mt-2 text-lg font-semibold break-words">{value}</div>
    </div>
  )
}
