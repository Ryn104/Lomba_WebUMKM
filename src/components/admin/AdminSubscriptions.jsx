import { useEffect, useMemo, useState } from 'react'
import { Crown, CreditCard, Wallet, Store as StoreIcon, Search } from 'lucide-react'
import { StatCard, EmptyState } from '../ui/Field'
import { formatDate, rupiah } from '../../lib/utils'
import { ChartCard, PageHeader, PlanBadge, PlanDonut, Pagination, StateBadge, Tabs } from './AdminWidgets'
import { PAGE_SIZE, countByPlan, estimateMRR, getSubscription } from './adminUtils'

export default function AdminSubscriptions({ stores, onManageSubscription }) {
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const rows = useMemo(() => stores.map((s) => ({ store: s, sub: getSubscription(s) })), [stores])
  const counts = useMemo(() => countByPlan(stores), [stores])
  const expiring = rows.filter(({ sub }) => sub.daysLeft !== null && sub.daysLeft <= 7).length
  const expired = rows.filter(({ sub }) => sub.state === 'expired').length

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows
      .filter(({ store, sub }) => {
        if (tab === 'gratis' || tab === 'bisnis' || tab === 'pro') return sub.plan === tab
        if (tab === 'expiring') return sub.daysLeft !== null && sub.daysLeft <= 7
        if (tab === 'expired') return sub.state === 'expired'
        return true
      })
      .filter(({ store }) => !term || store.name.toLowerCase().includes(term) || (store.profiles?.email || '').toLowerCase().includes(term))
  }, [rows, tab, q])

  useEffect(() => { setPage(1) }, [tab, q])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Status Paket" desc="Pantau paket Gratis, Bisnis, dan Pro setiap toko." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={StoreIcon} tone="neutral" label="Paket Gratis" value={counts.gratis} />
        <StatCard icon={CreditCard} tone="info" label="Paket Bisnis" value={counts.bisnis} />
        <StatCard icon={Crown} tone="green" label="Paket Pro" value={counts.pro} />
        <StatCard icon={Wallet} tone="amber" label="Estimasi MRR" value={rupiah(estimateMRR(stores))} sub="Hanya langganan yang dibeli" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Distribusi paket" desc="Paket aktif saat ini">
          <PlanDonut counts={counts} />
        </ChartCard>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="space-y-3 border-b border-slate-100 p-4">
            <Tabs
              value={tab}
              onChange={setTab}
              options={[
                { value: 'all', label: 'Semua', count: rows.length },
                { value: 'gratis', label: 'Gratis', count: counts.gratis },
                { value: 'bisnis', label: 'Bisnis', count: counts.bisnis },
                { value: 'pro', label: 'Pro', count: counts.pro },
                { value: 'expiring', label: 'Segera berakhir', count: expiring },
                { value: 'expired', label: 'Kedaluwarsa', count: expired },
              ]}
            />
            <div className="relative max-w-xs">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input className="input pl-9" placeholder="Cari toko / email…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Crown} title="Tidak ada toko" desc="Tidak ada toko yang cocok dengan filter ini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Toko</th>
                    <th className="px-4 py-3">Paket</th>
                    <th className="px-4 py-3">Berlaku sampai</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map(({ store, sub }) => (
                    <tr key={store.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{store.name}</p>
                        <p className="text-xs text-slate-400">{store.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PlanBadge plan={sub.plan} />
                          <StateBadge state={sub.state} />
                        </div>
                        {sub.plan !== 'gratis' && <p className="mt-1 text-xs text-slate-500">{sub.period === 'yearly' ? 'Tahunan' : 'Bulanan'}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {sub.renewsAt ? (
                          <>
                            <p className="text-slate-800">{formatDate(sub.renewsAt)}</p>
                            <p className={`text-xs ${sub.daysLeft !== null && sub.daysLeft <= 7 ? 'font-medium text-red-600' : 'text-slate-500'}`}>
                              {sub.daysLeft === null ? 'Sudah berakhir' : sub.daysLeft <= 0 ? 'Berakhir hari ini' : `${sub.daysLeft} hari lagi`}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400">{sub.plan === 'gratis' ? '-' : 'Tanpa batas waktu'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button title="Kelola langganan" className="rounded p-1.5 text-brand-700 hover:bg-brand-50" onClick={() => onManageSubscription(store)}>
                            <CreditCard size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}