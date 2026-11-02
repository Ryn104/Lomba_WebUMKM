import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Users, Store, ExternalLink, CreditCard, Wallet, UserPlus, Clock } from 'lucide-react'
import { StatCard } from '../ui/Field'
import { rupiah, formatDate } from '../../lib/utils'
import { Avatar, ChartCard, PageHeader, PlanBadge, PlanDonut } from './AdminWidgets'
import { buildSeries, collectPurchases, countByPlan, estimateMRR, getSubscription, jakartaDay } from './adminUtils'

export default function AdminOverview({ stores, users }) {
  const data = useMemo(() => {
    const live = stores.filter((s) => s.is_published && s.is_active).length
    const counts = countByPlan(stores)
    const series14 = buildSeries(users, (u) => u.created_at, 'day', 14)
    const newThisWeek = series14.slice(-7).reduce((a, b) => a + b.baru, 0)
    const monthKey = jakartaDay(new Date()).slice(0, 7)
    const revenueMonth = collectPurchases(stores)
      .filter((p) => jakartaDay(p.date).startsWith(monthKey))
      .reduce((a, b) => a + b.amount, 0)
    const expiring = stores
      .map((s) => ({ store: s, sub: getSubscription(s) }))
      .filter(({ sub }) => sub.daysLeft !== null && sub.daysLeft <= 7)
      .sort((a, b) => a.sub.daysLeft - b.sub.daysLeft)
    const owners = new Set(stores.map((s) => s.owner_id))
    const withoutStore = users.filter((u) => u.role !== 'admin' && !owners.has(u.id)).length
    return { live, counts, series14, newThisWeek, revenueMonth, expiring, withoutStore }
  }, [stores, users])

  const paid = data.counts.bisnis + data.counts.pro

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Admin" desc="Pantau pengguna, toko, dan langganan di seluruh platform." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} tone="info" label="Total pengguna" value={users.length} sub={`+${data.newThisWeek} dalam 7 hari terakhir`} />
        <StatCard icon={Store} label="Total toko" value={stores.length} sub={`${stores.length - data.live} draft / nonaktif`} />
        <StatCard icon={ExternalLink} tone="green" label="Toko online (live)" value={data.live} />
        <StatCard icon={CreditCard} tone="amber" label="Paket Bisnis / Pro" value={paid} sub={`${data.counts.bisnis} Bisnis · ${data.counts.pro} Pro`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} tone="green" label="Pendapatan bulan ini" value={rupiah(data.revenueMonth)} sub="Dari pembelian paket" />
        <StatCard icon={Wallet} tone="neutral" label="Estimasi MRR" value={rupiah(estimateMRR(stores))} sub="Langganan berbayar aktif" />
        <StatCard icon={Clock} tone="red" label="Segera berakhir" value={data.expiring.length} sub="Paket berakhir ≤ 7 hari" />
        <StatCard icon={UserPlus} tone="neutral" label="Belum buat toko" value={data.withoutStore} sub="Pengguna terdaftar tanpa toko" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Pendaftar 14 hari terakhir" desc="Jumlah akun baru per hari">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.series14}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Bar dataKey="baru" name="Pendaftar" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Distribusi paket" desc="Berdasarkan paket yang sedang aktif">
          <PlanDonut counts={data.counts} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="font-semibold text-slate-900">Pendaftar terbaru</h2>
            <Link to="/admin/pengguna" className="text-xs font-semibold text-brand-700 hover:underline">Lihat semua</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {users.slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar profile={u} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{u.full_name || '-'}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <span className="text-xs text-slate-400">{formatDate(u.created_at)}</span>
              </li>
            ))}
            {users.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">Belum ada pengguna</li>}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="font-semibold text-slate-900">Paket segera berakhir</h2>
            <Link to="/admin/langganan" className="text-xs font-semibold text-brand-700 hover:underline">Kelola paket</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.expiring.slice(0, 5).map(({ store, sub }) => (
              <li key={store.id} className="flex items-center gap-3 px-4 py-3">
                <span className="rounded-lg bg-slate-100 p-2 text-slate-500"><Store size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{store.name}</p>
                  <p className="truncate text-xs text-slate-500">{store.profiles?.email}</p>
                </div>
                <div className="text-right">
                  <PlanBadge plan={sub.plan} />
                  <p className="mt-1 text-xs text-slate-500">{sub.daysLeft <= 0 ? 'Hari ini' : `${sub.daysLeft} hari lagi`}</p>
                </div>
              </li>
            ))}
            {data.expiring.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">Tidak ada paket yang akan berakhir minggu ini</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}