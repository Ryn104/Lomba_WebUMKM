import { Routes, Route } from 'react-router-dom'
import { LayoutDashboard, Package, Percent, Wallet, ReceiptText, Blocks, Settings, ExternalLink } from 'lucide-react'
import DashboardLayout from '../components/ui/Sidebar'
import { Spinner } from '../components/ui/Field'
import { useMyStore } from '../hooks/useMyStore'
import { PLATFORM_DOMAIN } from '../lib/supabase'
import CreateStore from '../components/builder/CreateStore'
import Overview from '../components/store-dashboard/Overview'
import Products from '../components/store-dashboard/Products'
import Discounts from '../components/store-dashboard/Discounts'
import Finance from '../components/store-dashboard/Finance'
import StoreSettings from '../components/store-dashboard/StoreSettings'

const links = [
  { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/dashboard/produk', label: 'Produk', icon: Package },
  { to: '/dashboard/diskon', label: 'Diskon', icon: Percent },
  { to: '/dashboard/keuangan', label: 'Keuangan', icon: Wallet },
  { to: '/pos', label: 'Kasir (POS)', icon: ReceiptText },
  { to: '/builder', label: 'Web Builder', icon: Blocks },
  { to: '/dashboard/pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function StoreDashboard() {
  const { store, setStore, loading, reload } = useMyStore()

  if (loading) return <Spinner full />
  if (!store) return <CreateStore onCreated={reload} />

  return (
    <DashboardLayout
      title={store.name}
      subtitle={`${PLATFORM_DOMAIN}/${store.slug}`}
      links={links}
      headerRight={
        <a
          href={`/${store.slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          <ExternalLink size={16} />
          <span className="hidden sm:inline">Lihat Website</span>
          {!store.is_published && <span className="rounded bg-amber-100 px-1.5 text-xs text-amber-700">Draft</span>}
        </a>
      }
    >
      <Routes>
        <Route index element={<Overview store={store} />} />
        <Route path="produk" element={<Products store={store} />} />
        <Route path="diskon" element={<Discounts store={store} />} />
        <Route path="keuangan" element={<Finance store={store} />} />
        <Route path="pengaturan" element={<StoreSettings store={store} setStore={setStore} />} />
      </Routes>
    </DashboardLayout>
  )
}
