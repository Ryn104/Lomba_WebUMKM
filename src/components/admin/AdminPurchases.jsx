import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Download, Receipt, Search, Wallet, TrendingUp } from 'lucide-react'
import { StatCard, EmptyState } from '../ui/Field'
import { formatDateTime, rupiah } from '../../lib/utils'
import { Badge, ChartCard, PageHeader, PlanBadge, Pagination, Tabs } from './AdminWidgets'
import { PAGE_SIZE, collectPurchases, downloadCSV, jakartaDay } from './adminUtils'

export default function AdminPurchases({ stores }) {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const purchases = useMemo(() => collectPurchases(stores), [stores])

  const stats = useMemo(() => {
    const monthKey = jakartaDay(new Date()).slice(0, 7)
    const total = purchases.reduce((a, b) => a + b.amount, 0)
    const month = purchases.filter((p) => jakartaDay(p.date).startsWith(monthKey)).reduce((a, b) => a + b.amount, 0)
    return { total, month, count: purchases.length, avg: purchases.length ? Math.round(total / purchases.length) : 0 }
  }, [purchases])

  // Pendapatan 6 bulan terakhir
  const chart = useMemo(() => {
    const [y, m] = jakartaDay(new Date()).split('-').map(Number)
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(y, m - 1 - (5 - i), 1))
      const key = d.toISOString().slice(0, 7)
      return {
        label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
        Pendapatan: purchases.filter((p) => jakartaDay(p.date).startsWith(key)).reduce((a, b) => a + b.amount, 0),
      }
    })
  }, [purchases])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return purchases.filter((p) =>
      (tab === 'all' || p.plan === tab)
      && (!term || p.id.toLowerCase().includes(term) || p.storeName.toLowerCase().includes(term) || p.ownerEmail.toLowerCase().includes(term))
    )
  }, [purchases, tab, q])

  useEffect(() => { setPage(1) }, [tab, q])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const exportCsv = () => downloadCSV('pembelian-paket.csv', filtered.map((p) => ({
    Invoice: p.id, Tanggal: p.date, Toko: p.storeName, Pemilik: p.ownerName, Email: p.ownerEmail,
    Paket: p.description, Metode: p.method, Jumlah: p.amount, Status: p.status,
  })))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembelian Paket"
        desc="Riwayat pembelian paket Bisnis dan Pro dari seluruh toko."
        actions={<button type="button" className="btn-secondary" onClick={exportCsv} disabled={!filtered.length}><Download size={16} /> Ekspor CSV</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} tone="green" label="Total pendapatan" value={rupiah(stats.total)} />
        <StatCard icon={TrendingUp} tone="info" label="Pendapatan bulan ini" value={rupiah(stats.month)} />
        <StatCard icon={Receipt} tone="amber" label="Jumlah transaksi" value={stats.count} />
        <StatCard icon={Wallet} tone="neutral" label="Rata-rata transaksi" value={rupiah(stats.avg)} />
      </div>

      <ChartCard title="Pendapatan 6 bulan terakhir" desc="Total nilai pembelian paket per bulan">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}rb` : v)} />
            <Tooltip formatter={(v) => rupiah(v)} />
            <Bar dataKey="Pendapatan" fill="#047857" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} options={[{ value: 'all', label: 'Semua' }, { value: 'bisnis', label: 'Bisnis' }, { value: 'pro', label: 'Pro' }]} />
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input className="input pl-9" placeholder="Cari invoice / toko / email…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="Belum ada pembelian" desc="Pembelian paket oleh pemilik toko akan muncul di sini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Toko</th>
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((p) => (
                  <tr key={`${p.storeSlug}-${p.id}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-800">{p.id}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(p.date)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{p.storeName}</p>
                      <p className="text-xs text-slate-400">{p.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={p.plan} />
                      <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.method}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{rupiah(p.amount)}</td>
                    <td className="px-4 py-3"><Badge tone={/lunas/i.test(p.status) ? 'success' : 'warning'}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  )
}