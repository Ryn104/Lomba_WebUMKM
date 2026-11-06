import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Download, Receipt, Search, Wallet, TrendingUp } from 'lucide-react'
import { StatCard, EmptyState } from '../ui/Field'
import { formatDateTime, rupiah } from '../../lib/utils'
import { Badge, ChartCard, PageHeader, PlanBadge, Pagination, Tabs } from './AdminWidgets'
import { PAGE_SIZE, RANGE_OPTIONS, buildSeries, collectPurchases, downloadCSV, filterBySeries, resolveRange } from './adminUtils'

export default function AdminPurchases({ stores }) {
  const [range, setRange] = useState('30')
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const purchases = useMemo(() => collectPurchases(stores), [stores])
  const cfg = useMemo(() => resolveRange(range, purchases, (p) => p.date), [range, purchases])
  const series = useMemo(() => buildSeries(purchases, (p) => p.date, cfg.mode, cfg.length, (p) => p.amount), [purchases, cfg])
  const inRange = useMemo(() => filterBySeries(purchases, (p) => p.date, series, cfg.mode), [purchases, series, cfg])

  const stats = useMemo(() => {
    const lifetimeTotal = purchases.reduce((a, b) => a + b.amount, 0)
    const total = inRange.reduce((a, b) => a + b.amount, 0)
    return { lifetimeTotal, total, count: inRange.length, avg: inRange.length ? Math.round(total / inRange.length) : 0 }
  }, [purchases, inRange])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return inRange.filter((p) =>
      (tab === 'all' || p.plan === tab)
      && (!term || p.id.toLowerCase().includes(term) || p.storeName.toLowerCase().includes(term) || p.ownerEmail.toLowerCase().includes(term))
    )
  }, [inRange, tab, q])

  useEffect(() => { setPage(1) }, [range, tab, q])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const xInterval = cfg.length > 30 ? Math.floor(cfg.length / 8) : 'preserveStartEnd'
  const per = cfg.mode === 'month' ? 'bulan' : 'hari'

  const exportCsv = () => downloadCSV('pembelian-paket.csv', filtered.map((p) => ({
    Invoice: p.id, Tanggal: p.date, Toko: p.storeName, Pemilik: p.ownerName, Email: p.ownerEmail,
    Paket: p.description, Metode: p.method, Jumlah: p.amount, Status: p.status,
  })))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembelian Paket"
        desc="Riwayat pembelian paket Bisnis dan Pro dari seluruh toko."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={range} onChange={setRange} options={RANGE_OPTIONS.map(({ value, label }) => ({ value, label }))} />
            <button type="button" className="btn-secondary" onClick={exportCsv} disabled={!filtered.length}><Download size={16} /> Ekspor CSV</button>
          </div>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={TrendingUp} tone="green" label={cfg.lifetime ? 'Pendapatan (lifetime)' : `Pendapatan (${cfg.label})`} value={rupiah(stats.total)} />
        <StatCard icon={Wallet} tone="info" label="Total pendapatan lifetime" value={rupiah(stats.lifetimeTotal)} />
        <StatCard icon={Receipt} tone="amber" label="Jumlah transaksi" value={stats.count} sub={cfg.lifetime ? 'Sejak awal' : cfg.label} />
        <StatCard icon={Wallet} tone="neutral" label="Rata-rata transaksi" value={rupiah(stats.avg)} />
      </div>

      <ChartCard title="Grafik pendapatan" desc={`Total nilai pembelian paket per ${per}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={xInterval} />
            <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}rb` : v)} />
            <Tooltip formatter={(v) => rupiah(v)} />
            <Bar dataKey="baru" name="Pendapatan" fill="#047857" radius={[4, 4, 0, 0]} />
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
          <EmptyState icon={Receipt} title="Belum ada pembelian" desc="Tidak ada pembelian paket pada rentang waktu ini." />
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