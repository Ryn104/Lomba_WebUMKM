import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Percent,
  Wallet,
  ReceiptText,
  Blocks,
  Settings,
  CreditCard,
  ExternalLink,
} from 'lucide-react'
import DashboardLayout from '../components/ui/Sidebar'
import { Spinner } from '../components/ui/Field'
import { useMyStore } from '../hooks/useMyStore'
import { useSubscription } from '../hooks/useSubscription'
import { PLATFORM_DOMAIN, supabase } from '../lib/supabase'
import CreateStore from '../components/builder/CreateStore'
import Overview from '../components/store-dashboard/Overview'
import Products from '../components/store-dashboard/Products'
import Discounts from '../components/store-dashboard/Discounts'
import Finance from '../components/store-dashboard/Finance'
import StoreSettings from '../components/store-dashboard/StoreSettings'
import SubscriptionPage from './SubscriptionPage'
import UpgradeModal from '../components/subscription/UpgradeModal'
import AccountProfilePage from './AccountProfilePage'
import AccountSecurityPage from './AccountSecurityPage'

const links = [
  { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/dashboard/produk', label: 'Produk', icon: Package },
  { to: '/dashboard/diskon', label: 'Diskon', icon: Percent },
  { to: '/dashboard/keuangan', label: 'Keuangan', icon: Wallet },
  { to: '/pos', label: 'Kasir (POS)', icon: ReceiptText },
  { to: '/builder', label: 'Web Builder', icon: Blocks },
  { to: '/dashboard/langganan', label: 'Langganan', icon: CreditCard },
  { to: '/dashboard/pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function StoreDashboard() {
  const { store, setStore, loading, reload } = useMyStore()
  const { plan, upgrade } = useSubscription(store, setStore)
  const nav = useNavigate()
  const [productsCount, setProductsCount] = useState(0)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => {
    if (!store?.id) return
    let alive = true
    ;(async () => {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', store.id)
      if (alive && typeof count === 'number') {
        setProductsCount(count)
      }
    })()
    return () => { alive = false }
  }, [store?.id])

  if (loading) return <Spinner full />
  if (!store) {
    return (
      <DashboardLayout title="UMKM Builder" links={links}>
        <Routes>
          <Route path="profil" element={<AccountProfilePage />} />
          <Route path="pengaturan-akun" element={<AccountSecurityPage />} />
          <Route path="*" element={<CreateStore onCreated={reload} />} />
        </Routes>
      </DashboardLayout>
    )
  }

  const isFree = plan === 'gratis'

  // Widget langganan di bagian bawah sidebar (Sesuai Mockup 1 & 4)
  const sidebarSubscriptionWidget = (
    <div className="p-3">
      <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-3 text-xs shadow-inner">
        <div className="flex items-center justify-between font-semibold">
          <span className="text-white">
            {plan === 'pro' ? 'Paket Pro' : plan === 'bisnis' ? 'Paket Bisnis' : 'Paket Gratis'}
          </span>
          <span className="text-slate-400">
            {isFree ? `${productsCount}/10 produk` : 'Tanpa batas'}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFree && productsCount >= 10
                ? 'bg-red-500'
                : 'bg-brand-500'
            }`}
            style={{
              width: isFree
                ? `${Math.min((productsCount / 10) * 100, 100)}%`
                : '100%',
            }}
          />
        </div>
        {isFree && (
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="mt-3 w-full rounded-lg bg-brand-700 py-1.5 text-center font-bold text-white shadow-sm transition hover:bg-brand-800"
          >
            Upgrade paket
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <DashboardLayout
        title={store.name}
        subtitle={`${PLATFORM_DOMAIN}/${store.slug}`}
        links={links}
        sidebarWidget={sidebarSubscriptionWidget}
        headerRight={
          <div className="flex items-center gap-2">
            {/* Badge status paket (Mockup 3) */}
            <span
              className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                plan === 'pro'
                  ? 'bg-brand-100 text-brand-900 border border-brand-200'
                  : plan === 'bisnis'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {plan === 'pro' ? 'Pro' : plan === 'bisnis' ? 'Bisnis' : 'Gratis'}
            </span>

            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Lihat Website</span>
              {!store.is_published && (
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E]">
                  Draft
                </span>
              )}
            </a>
          </div>
        }
      >
        <Routes>
          <Route index element={<Overview store={store} />} />
          <Route path="produk" element={<Products store={store} setStore={setStore} />} />
          <Route path="diskon" element={<Discounts store={store} />} />
          <Route path="keuangan" element={<Finance store={store} setStore={setStore} />} />
          <Route path="langganan" element={<SubscriptionPage store={store} setStore={setStore} />} />
          <Route path="pengaturan" element={<StoreSettings store={store} setStore={setStore} />} />
          <Route path="profil" element={<AccountProfilePage />} />
          <Route path="pengaturan-akun" element={<AccountSecurityPage />} />
        </Routes>
      </DashboardLayout>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        targetPlan="bisnis"
        onSuccess={async ({ targetPlan, period, method, amount }) => {
          const activated = await upgrade({ targetPlan, period, method, amount })
          if (activated) nav('/dashboard/langganan')
          return activated
        }}
      />
    </>
  )
}
