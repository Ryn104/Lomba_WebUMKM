import { useEffect, useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LayoutDashboard, Store, Users, ExternalLink, Power, Trash2, Search, Home } from 'lucide-react'
import { supabase, PLATFORM_DOMAIN } from '../lib/supabase'
import DashboardLayout from '../components/ui/Sidebar'
import { StatCard, Spinner, EmptyState } from '../components/ui/Field'
import { formatDate } from '../lib/utils'

const links = [
  { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
  { to: '/', label: 'Beranda Platform', icon: Home },
]

export default function AdminDashboard() {
  const [stores, setStores] = useState(null)
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const [s, u] = await Promise.all([
      supabase.from('stores').select('*, profiles(full_name,email)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,role'),
    ])
    setStores(s.data || [])
    setUsers(u.data || [])
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (s) => {
    const { error } = await supabase.from('stores').update({ is_active: !s.is_active }).eq('id', s.id)
    if (error) return toast.error(error.message)
    toast.success(s.is_active ? 'Toko dinonaktifkan' : 'Toko diaktifkan')
    load()
  }

  const remove = async (s) => {
    if (!confirm(`Hapus toko “${s.name}” beserta seluruh datanya? Tindakan ini tidak bisa dibatalkan.`)) return
    const { error } = await supabase.from('stores').delete().eq('id', s.id)
    if (error) return toast.error(error.message)
    toast.success('Toko dihapus')
    load()
  }

  return (
    <DashboardLayout title="Admin Platform" subtitle={PLATFORM_DOMAIN} links={links}>
      <Routes>
        <Route
          index
          element={
            !stores ? (
              <Spinner />
            ) : (
              <Content stores={stores} users={users} q={q} setQ={setQ} toggleActive={toggleActive} remove={remove} />
            )
          }
        />
      </Routes>
    </DashboardLayout>
  )
}

function Content({ stores, users, q, setQ, toggleActive, remove }) {
  const published = stores.filter((s) => s.is_published && s.is_active).length
  const list = stores.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.slug.includes(q.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-sm text-slate-500">Pantau seluruh toko UMKM yang terdaftar di platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Store} label="Total toko" value={stores.length} />
        <StatCard icon={ExternalLink} tone="green" label="Toko online (live)" value={published} sub={`${stores.length - published} draft / nonaktif`} />
        <StatCard icon={Users} tone="amber" label="Total pengguna" value={users.length} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h2 className="font-semibold">Semua toko UMKM</h2>
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input className="input pl-9" placeholder="Cari nama / alamat…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={Store} title="Tidak ada toko" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Toko</th>
                  <th className="px-4 py-3">Pemilik</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dibuat</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{s.name}</p>
                      <a href={`/${s.slug}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
                        {PLATFORM_DOMAIN}/{s.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p>{s.profiles?.full_name || '-'}</p>
                      <p className="text-xs text-slate-400">{s.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${!s.is_active ? 'bg-red-100 text-red-600' : s.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {!s.is_active ? 'Nonaktif' : s.is_published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button title={s.is_active ? 'Nonaktifkan' : 'Aktifkan'} className="rounded p-1.5 hover:bg-slate-100" onClick={() => toggleActive(s)}>
                          <Power size={15} className={s.is_active ? 'text-emerald-600' : 'text-slate-400'} />
                        </button>
                        <button title="Hapus" className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => remove(s)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
