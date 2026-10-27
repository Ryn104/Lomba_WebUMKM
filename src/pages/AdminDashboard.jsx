import { useEffect, useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LayoutDashboard, Store, Users, ExternalLink, Power, Trash2, Search, Home, CreditCard, X } from 'lucide-react'
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
  const [selectedStore, setSelectedStore] = useState(null)
  const [savingSubscription, setSavingSubscription] = useState(false)

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

  const saveSubscription = async ({ store, plan, renewalDate }) => {
    if (savingSubscription) return
    setSavingSubscription(true)
    const previous = store.theme?.subscription || {}
    const isPaidPlan = plan !== 'gratis'
    const nextSubscription = {
      ...previous,
      plan,
      status: 'active',
      billingMode: isPaidPlan ? 'complimentary' : 'free',
      activatedAt: isPaidPlan ? previous.activatedAt || new Date().toISOString() : null,
      renewsAt: isPaidPlan && renewalDate ? new Date(`${renewalDate}T23:59:59+07:00`).toISOString() : null,
      trialEndsAt: null,
      paymentMethod: null,
    }
    const nextTheme = { ...(store.theme || {}), subscription: nextSubscription }

    try {
      const { data, error } = await supabase
        .from('stores')
        .update({ theme: nextTheme })
        .eq('id', store.id)
        .select('id, theme')
        .single()
      if (error) throw error
      setStores((current) => current.map((item) => item.id === store.id ? { ...item, theme: data.theme } : item))
      setSelectedStore(null)
      toast.success(`Akses paket ${plan === 'gratis' ? 'Gratis' : plan === 'pro' ? 'Pro' : 'Bisnis'} diperbarui.`)
    } catch (error) {
      toast.error(`Paket gagal disimpan: ${error.message}`)
    } finally {
      setSavingSubscription(false)
    }
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
              <Content stores={stores} users={users} q={q} setQ={setQ} toggleActive={toggleActive} remove={remove} onManageSubscription={setSelectedStore} />
            )
          }
        />
      </Routes>
      {selectedStore && (
        <SubscriptionAdminModal
          store={selectedStore}
          saving={savingSubscription}
          onClose={() => !savingSubscription && setSelectedStore(null)}
          onSave={(details) => saveSubscription({ store: selectedStore, ...details })}
        />
      )}
    </DashboardLayout>
  )
}

function SubscriptionAdminModal({ store, saving, onClose, onSave }) {
  const currentSubscription = store.theme?.subscription || {}
  const [plan, setPlan] = useState(['gratis', 'bisnis', 'pro'].includes(currentSubscription.plan) ? currentSubscription.plan : 'gratis')
  const [renewalDate, setRenewalDate] = useState(currentSubscription.renewsAt ? currentSubscription.renewsAt.slice(0, 10) : '')
  const isPaid = plan !== 'gratis'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="admin-subscription-title">
      <button type="button" aria-label="Tutup" disabled={saving} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm disabled:cursor-wait" onClick={onClose} />
      <form
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault()
          onSave({ plan, renewalDate })
        }}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="admin-subscription-title" className="text-lg font-bold text-slate-900">Kelola langganan</h2>
            <p className="mt-1 text-sm text-slate-500">{store.name} · {store.profiles?.email || 'Pemilik toko'}</p>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Paket toko</span>
            <select className="input mt-2" value={plan} onChange={(event) => setPlan(event.target.value)}>
              <option value="gratis">Gratis</option>
              <option value="bisnis">Bisnis</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          {isPaid && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Akses berlaku sampai</span>
              <input
                className="input mt-2"
                type="date"
                min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}
                value={renewalDate}
                onChange={(event) => setRenewalDate(event.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-500">Kosongkan untuk akses tanpa batas waktu.</span>
            </label>
          )}
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
            Perubahan paket langsung diterapkan pada fitur toko. Pengelolaan ini tidak membuat tagihan atau invoice.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" disabled={saving} onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={saving} className="btn-primary min-w-32 justify-center disabled:opacity-60">
            {saving ? 'Menyimpan…' : 'Simpan paket'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Content({ stores, users, q, setQ, toggleActive, remove, onManageSubscription }) {
  const published = stores.filter((s) => s.is_published && s.is_active).length
  const paidSubscriptions = stores.filter((s) => {
    const subscription = s.theme?.subscription || {}
    return ['bisnis', 'pro'].includes(subscription.plan)
      && ['active', 'complimentary'].includes(subscription.billingMode)
      && (!subscription.renewsAt || new Date(subscription.renewsAt).getTime() > Date.now())
  }).length
  const list = stores.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.slug.includes(q.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-sm text-slate-500">Pantau seluruh toko UMKM yang terdaftar di platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Store} label="Total toko" value={stores.length} />
        <StatCard icon={ExternalLink} tone="green" label="Toko online (live)" value={published} sub={`${stores.length - published} draft / nonaktif`} />
        <StatCard icon={Users} tone="amber" label="Total pengguna" value={users.length} />
        <StatCard icon={CreditCard} tone="amber" label="Paket Bisnis / Pro" value={paidSubscriptions} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-900">Semua toko UMKM</h2>
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
                  <th className="px-4 py-3">Langganan</th>
                  <th className="px-4 py-3">Dibuat</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <a href={`/${s.slug}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline">
                        {PLATFORM_DOMAIN}/{s.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{s.profiles?.full_name || '-'}</p>
                      <p className="text-xs text-slate-400">{s.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${!s.is_active ? 'bg-[#FEE2E2] text-[#991B1B]' : s.is_published ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                        {!s.is_active ? 'Nonaktif' : s.is_published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold capitalize text-slate-800">{s.theme?.subscription?.plan || 'gratis'}</p>
                      <p className="text-xs text-slate-500">
                        {s.theme?.subscription?.renewsAt
                          ? new Date(s.theme.subscription.renewsAt).getTime() <= Date.now()
                            ? `Berakhir ${formatDate(s.theme.subscription.renewsAt)}`
                            : `Berlaku sampai ${formatDate(s.theme.subscription.renewsAt)}`
                          : 'Tanpa batas waktu'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button title="Kelola langganan" className="rounded p-1.5 text-brand-700 hover:bg-brand-50" onClick={() => onManageSubscription(s)}>
                          <CreditCard size={15} />
                        </button>
                        <button title={s.is_active ? 'Nonaktifkan' : 'Aktifkan'} className="rounded p-1.5 hover:bg-slate-100" onClick={() => toggleActive(s)}>
                          <Power size={15} className={s.is_active ? 'text-brand-700' : 'text-slate-400'} />
                        </button>
                        <button title="Hapus" className="rounded p-1.5 text-red-600 hover:bg-red-50" onClick={() => remove(s)}>
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
