import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LayoutDashboard, Users, Home, Crown, Receipt, TrendingUp } from 'lucide-react'
import { supabase, PLATFORM_DOMAIN } from '../lib/supabase'
import DashboardLayout from '../components/ui/Sidebar'
import { Spinner } from '../components/ui/Field'
import AdminOverview from '../components/admin/AdminOverview'
import AdminUsers from '../components/admin/AdminUsers'
import AdminSubscriptions from '../components/admin/AdminSubscriptions'
import AdminPurchases from '../components/admin/AdminPurchases'
import AdminGrowth from '../components/admin/AdminGrowth'
import SubscriptionAdminModal from '../components/admin/SubscriptionAdminModal'

const links = [
  { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/admin/pengguna', label: 'Pengguna', icon: Users },
  { to: '/admin/langganan', label: 'Status Paket', icon: Crown },
  { to: '/admin/pembelian', label: 'Pembelian Paket', icon: Receipt },
  { to: '/admin/pertumbuhan', label: 'Grafik Pendaftar', icon: TrendingUp },
  { to: '/', label: 'Beranda Platform', icon: Home },
]

export default function AdminDashboard() {
  const [stores, setStores] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [savingSubscription, setSavingSubscription] = useState(false)

  const load = useCallback(async () => {
    const [s, u] = await Promise.all([
      supabase.from('stores').select('*, profiles(full_name,email)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name,email,phone,avatar_url,role,created_at').order('created_at', { ascending: false }),
    ])
    if (s.error || u.error) toast.error(`Gagal memuat data: ${(s.error || u.error).message}`)
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

  const changeRole = async (profile) => {
    const nextRole = profile.role === 'admin' ? 'umkm' : 'admin'
    const name = profile.full_name || profile.email
    const message = nextRole === 'admin'
      ? `Jadikan “${name}” sebagai admin platform? Admin dapat melihat dan mengubah semua toko.`
      : `Cabut akses admin dari “${name}”?`
    if (!confirm(message)) return
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', profile.id)
    if (error) return toast.error(error.message)
    setUsers((current) => current.map((item) => (item.id === profile.id ? { ...item, role: nextRole } : item)))
    toast.success(nextRole === 'admin' ? 'Pengguna dijadikan admin' : 'Akses admin dicabut')
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
      setStores((current) => current.map((item) => (item.id === store.id ? { ...item, theme: data.theme } : item)))
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
      {!stores ? (
        <Spinner />
      ) : (
        <Routes>
          <Route index element={<AdminOverview stores={stores} users={users} />} />
          <Route path="pengguna" element={<AdminUsers users={users} stores={stores} onChangeRole={changeRole} toggleActive={toggleActive} remove={remove} onManageSubscription={setSelectedStore} />} />
          <Route path="langganan" element={<AdminSubscriptions stores={stores} onManageSubscription={setSelectedStore} />} />
          <Route path="pembelian" element={<AdminPurchases stores={stores} />} />
          <Route path="pertumbuhan" element={<AdminGrowth users={users} stores={stores} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      )}
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