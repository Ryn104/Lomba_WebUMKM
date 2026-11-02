import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, ShieldOff, Users, Download, CreditCard, Power, Trash2 } from 'lucide-react'
import { StatCard, EmptyState } from '../ui/Field'
import { useAuth } from '../../context/AuthContext'
import { PLATFORM_DOMAIN } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { Avatar, Badge, PageHeader, PlanBadge, Pagination, StateBadge } from './AdminWidgets'
import { PAGE_SIZE, USER_STATUS_FILTERS, downloadCSV, getSubscription, getUserStatus, groupStoresByOwner } from './adminUtils'

const storeStatus = (s) => (!s.is_active ? { label: 'Nonaktif', tone: 'danger' } : s.is_published ? { label: 'Live', tone: 'success' } : { label: 'Draft', tone: 'warning' })

export default function AdminUsers({ users, stores, onChangeRole, toggleActive, remove, onManageSubscription }) {
  const { user: me } = useAuth()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const rows = useMemo(() => {
    const byOwner = groupStoresByOwner(stores)
    return users.map((u) => {
      const owned = byOwner.get(u.id) || []
      return { ...u, owned, status: getUserStatus(u, owned) }
    })
  }, [users, stores])

  const summary = useMemo(() => ({
    total: rows.length,
    live: rows.filter((r) => r.status.key === 'live').length,
    noStore: rows.filter((r) => r.status.key === 'no-store').length,
    suspended: rows.filter((r) => r.status.key === 'suspended').length,
  }), [rows])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) =>
      (status === 'all' || r.status.key === status)
      && (!term
        || (r.full_name || '').toLowerCase().includes(term)
        || (r.email || '').toLowerCase().includes(term)
        || (r.phone || '').includes(term)
        || r.owned.some((s) => s.name.toLowerCase().includes(term) || s.slug.includes(term)))
    )
  }, [rows, q, status])

  useEffect(() => { setPage(1) }, [q, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const exportCsv = () => downloadCSV('pengguna.csv', filtered.map((r) => ({
    Nama: r.full_name || '',
    Email: r.email || '',
    Telepon: r.phone || '',
    Role: r.role,
    Status: r.status.label,
    Toko: r.owned.map((s) => s.name).join(' | '),
    Paket: r.owned.map((s) => getSubscription(s).plan).join(' | '),
    Terdaftar: r.created_at,
  })))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengguna"
        desc="Kelola akun, toko, dan paket langganan setiap pengguna."
        actions={<button type="button" className="btn-secondary" onClick={exportCsv} disabled={!filtered.length}><Download size={16} /> Ekspor CSV</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} tone="info" label="Total pengguna" value={summary.total} />
        <StatCard icon={Users} tone="green" label="Toko live" value={summary.live} />
        <StatCard icon={Users} tone="neutral" label="Belum buat toko" value={summary.noStore} />
        <StatCard icon={Users} tone="red" label="Toko nonaktif" value={summary.suspended} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input className="input pl-9" placeholder="Cari nama / email / toko…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            {USER_STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Pengguna tidak ditemukan" desc="Coba ubah kata kunci atau filter status." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Toko</th>
                  <th className="px-4 py-3">Langganan</th>
                  <th className="px-4 py-3">Terdaftar</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((r) => {
                  const isMe = r.id === me?.id
                  return (
                    <tr key={r.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar profile={r} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{r.full_name || '-'}{isMe && <span className="ml-1 text-xs font-normal text-slate-400">(Anda)</span>}</p>
                            <p className="truncate text-xs text-slate-500">{r.email}</p>
                            {r.phone && <p className="text-xs text-slate-400">{r.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge tone={r.status.tone}>{r.status.label}</Badge></td>

                      <td className="px-4 py-3">
                        {r.owned.length === 0 ? <span className="text-slate-400">-</span> : (
                          <div className="space-y-3">
                            {r.owned.map((s) => {
                              const st = storeStatus(s)
                              return (
                                <div key={s.id}>
                                    <div className='flex items-center'>
                                        <p className="font-semibold text-slate-900">{s.name}</p>
                                        <div className="ms-2"><Badge tone={st.tone}>{st.label}</Badge></div>
                                    </div>
                                  <a href={`/${s.slug}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline">
                                    {PLATFORM_DOMAIN}/{s.slug}
                                  </a>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {r.owned.length === 0 ? <span className="text-slate-400">-</span> : (
                          <div className="space-y-3">
                            {r.owned.map((s) => {
                              const sub = getSubscription(s)
                              return (
                                <div key={s.id}>
                                  <div className="flex flex-wrap items-center gap-1.5"><PlanBadge plan={sub.plan} /><StateBadge state={sub.state} /></div>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {sub.renewsAt
                                      ? sub.daysLeft === null ? `Berakhir ${formatDate(sub.renewsAt)}` : `Berlaku sampai ${formatDate(sub.renewsAt)}`
                                      : sub.plan === 'gratis' ? '' : 'Tanpa batas waktu'}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500">{formatDate(r.created_at)}</td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {r.owned.map((s) => (
                            <div key={s.id} className="flex items-center gap-1">
                              <button type="button" title={`Kelola langganan — ${s.name}`} className="rounded p-1.5 text-brand-700 hover:bg-brand-50" onClick={() => onManageSubscription(s)}><CreditCard size={15} /></button>
                              <button type="button" title={`${s.is_active ? 'Nonaktifkan' : 'Aktifkan'} — ${s.name}`} className="rounded p-1.5 hover:bg-slate-100" onClick={() => toggleActive(s)}>
                                <Power size={15} className={s.is_active ? 'text-brand-700' : 'text-slate-400'} />
                              </button>
                              <button type="button" title={`Hapus — ${s.name}`} className="rounded p-1.5 text-red-600 hover:bg-red-50" onClick={() => remove(s)}><Trash2 size={15} /></button>
                            </div>
                          ))}
                          <button
                            type="button"
                            disabled={isMe}
                            title={isMe ? 'Tidak bisa mengubah role sendiri' : r.role === 'admin' ? 'Cabut akses admin' : 'Jadikan admin'}
                            className={`rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 ${r.owned.length ? 'ml-1 border-l border-slate-200 pl-2' : ''}`}
                            onClick={() => onChangeRole(r)}
                          >
                            {r.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  )
}