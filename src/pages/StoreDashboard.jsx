import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Home,
  LayoutDashboard,
  Package,
  Percent,
  Wallet,
  ReceiptText,
  Blocks,
  CreditCard,
  ExternalLink,
  Crown,
  Clock,
} from 'lucide-react'
import DashboardLayout from '../components/ui/Sidebar'
import { Spinner } from '../components/ui/Field'
import { useMyStore } from '../hooks/useMyStore'
import { useSubscription } from '../hooks/useSubscription'
import { useTheme } from '../context/ThemeContext'
import { PLATFORM_DOMAIN, supabase } from '../lib/supabase'
import Overview from '../components/store-dashboard/Overview'
import Products from '../components/store-dashboard/Products'
import Discounts from '../components/store-dashboard/Discounts'
import Finance from '../components/store-dashboard/Finance'
import SubscriptionPage from './SubscriptionPage'
import UpgradeModal from '../components/subscription/UpgradeModal'
import AccountProfilePage from './AccountProfilePage'
import AccountSecurityPage from './AccountSecurityPage'
import { ThemeIconButton } from '../components/ui/ThemeToggle'

const links = [
  { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/dashboard/produk', label: 'Produk', icon: Package },
  { to: '/dashboard/diskon', label: 'Diskon', icon: Percent },
  { to: '/dashboard/keuangan', label: 'Keuangan', icon: Wallet },
  { to: '/dashboard/langganan', label: 'Langganan', icon: CreditCard },
]

// Fitur khusus dengan layout halaman sendiri (tanpa sidebar dashboard)
const specialLinks = [
  { to: '/pos', label: 'Kasir (POS)', icon: ReceiptText },
  { to: '/builder', label: 'Web Builder', icon: Blocks },
]

// Gaya bersama untuk seluruh halaman dashboard toko (Ringkasan, Produk, Diskon, Keuangan, dst.).
// Semuanya dibatasi pada .store-scope sehingga halaman lain tidak terpengaruh.
const storeCss = `
@keyframes sd-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes sd-drift { 0%, 100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-46%, 18px) scale(1.08); } }
.sd-drift { animation: sd-drift 12s ease-in-out infinite; }

/* Elemen halaman muncul berurutan: judul -> kartu statistik -> grafik/tabel */
.sd-stagger > div > *:not(.grid) { animation: sd-fade-up .6s cubic-bezier(.2,.7,.2,1) both; }
.sd-stagger > div > *:nth-child(2) { animation-delay: 70ms; }
.sd-stagger > div > *:nth-child(3) { animation-delay: 140ms; }
.sd-stagger > div > *:nth-child(4) { animation-delay: 210ms; }
.sd-stagger > div > *:nth-child(5) { animation-delay: 280ms; }
.sd-stagger > div > *:nth-child(n+6) { animation-delay: 350ms; }
.sd-stagger > div > .grid > * { animation: sd-fade-up .6s cubic-bezier(.2,.7,.2,1) both; animation-delay: 100ms; }
.sd-stagger > div > .grid > *:nth-child(2) { animation-delay: 160ms; }
.sd-stagger > div > .grid > *:nth-child(3) { animation-delay: 220ms; }
.sd-stagger > div > .grid > *:nth-child(4) { animation-delay: 280ms; }
.sd-stagger > div > .grid > *:nth-child(n+5) { animation-delay: 340ms; }

/* Header & kontrol form */
.store-scope .sd-header-title { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.025em; color: #0F172A; }
.dark .store-scope .sd-header-title { color: #F8FAFC; }
.store-scope .sd-header-desc { font-size: 0.875rem; color: #64748B; margin-top: 0.25rem; }
.dark .store-scope .sd-header-desc { color: #94A3B8; }

.store-scope .sd-search {
  position: relative;
  width: 100%;
}
.store-scope .sd-search input {
  width: 100%;
  padding-left: 2.25rem;
  padding-right: 0.875rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-size: 0.875rem;
  border-radius: 9999px;
  border: 1px solid #E2E8F0;
  background-color: #FFFFFF;
  color: #0F172A;
  transition: all 0.2s;
}
.dark .store-scope .sd-search input {
  border-color: #334155;
  background-color: #1E293B;
  color: #F8FAFC;
}
.store-scope .sd-search input:focus {
  outline: none;
  border-color: #15803D;
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.15);
}

/* Modal form grid: dua kolom di layar sm+, satu kolom di ponsel */
.store-scope .sd-form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .store-scope .sd-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`

export default function StoreDashboard() {
  const { store, setStore, loading } = useMyStore()
  const { plan, isTrial, isExpired, isPaid, trialDaysLeft, upgrade } = useSubscription(store, setStore)
  const { isDark } = useTheme()
  const location = useLocation()
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
    return () => {
      alive = false
    }
  }, [store?.id])

  if (loading) return <Spinner full />
  // Pengguna baru (belum punya toko) menyelesaikan wizard onboarding,
  // bukan formulir CreateStore di dalam dashboard.
  if (!store) return <Navigate to="/onboarding" replace />

  // Warna widget mengikuti tema sidebar (terang / gelap)
  const w = isDark
    ? { card: 'border-[#1E293B] bg-[#111A2E]', title: 'text-white', muted: 'text-[#94A3B8]', track: 'bg-[#334155]' }
    : { card: 'border-[#E2E8F0] bg-[#F8FAFC]', title: 'text-[#0F172A]', muted: 'text-[#64748B]', track: 'bg-[#E2E8F0]' }

  // Widget langganan di bagian bawah sidebar
  const sidebarSubscriptionWidget = (
    <div className="p-3">
      <div className={`relative overflow-hidden rounded-xl border p-3 text-xs ${w.card}`}>
        <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-brand-500/20 blur-2xl" />
        <div className="relative flex items-center justify-between font-semibold">
          <span className={`flex items-center gap-1.5 ${w.title}`}>
            {isPaid ? <Crown size={13} className="text-brand-500" /> : <Clock size={13} className="text-brand-500" />}
            {isPaid ? `Paket ${plan === 'pro' ? 'Pro' : plan === 'bisnis' ? 'Bisnis' : 'Basic'}` : isTrial ? 'Trial 1 Bulan' : 'Trial Berakhir'}
          </span>
          <span className={w.muted}>
            {isTrial ? `${trialDaysLeft} hari lagi` : isPaid ? (plan === 'basic' ? `${productsCount}/50 produk` : 'Tanpa batas') : 'Nonaktif'}
          </span>
        </div>
        <div className={`relative mt-2 h-1.5 w-full overflow-hidden rounded-full ${w.track}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${isExpired ? 'bg-red-500' : 'bg-gradient-to-r from-brand-600 to-brand-400'}`}
            style={{ width: isPaid && plan === 'basic' ? `${Math.min((productsCount / 50) * 100, 100)}%` : '100%' }}
          />
        </div>
        {!isPaid && (
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="relative mt-3 w-full rounded-full bg-gradient-to-r from-brand-700 to-brand-600 py-2 text-center font-bold text-white shadow-md shadow-brand-700/25 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            {isTrial ? 'Pilih paket' : 'Aktifkan paket'}
          </button>
        )}
      </div>
    </div>
  )

  const planBadge = isPaid
    ? plan === 'pro'
      ? 'border-[#BBF7D0] bg-[#DCFCE7] text-[#166534]'
      : plan === 'bisnis'
        ? 'border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]'
        : 'border-[#E0E7FF] bg-[#EEF2FF] text-[#3730A3]'
    : isTrial
      ? 'border-[#BAE6FD] bg-[#E0F2FE] text-[#0369A1]'
      : 'border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]'

  const planLabel = isPaid
    ? plan === 'pro'
      ? 'Pro'
      : plan === 'bisnis'
        ? 'Bisnis'
        : 'Basic'
    : isTrial
      ? `Trial (${trialDaysLeft} hr)`
      : 'Trial Berakhir'

  return (
    <>
      <style>{storeCss}</style>
      <DashboardLayout
        title={store.name}
        subtitle={`${PLATFORM_DOMAIN}/${store.slug}`}
        links={links}
        specialLinks={specialLinks}
        sidebarWidget={sidebarSubscriptionWidget}
        headerRight={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Badge status paket */}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:gap-1.5 sm:px-3 sm:text-xs ${planBadge}`}>
              {isPaid ? <Crown size={12} /> : <Clock size={12} />}
              {planLabel}
            </span>

            <ThemeIconButton className="btn-secondary !rounded-full" />

            <Link to="/" className="btn-secondary !rounded-full">
              <Home size={16} />
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary !rounded-full"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Lihat Toko</span>
            </a>
          </div>
        }
      >
        <div className="store-scope max-w-7xl">
          <div key={location.pathname} className="sd-stagger">
            <Routes>
              <Route index element={<Overview store={store} setStore={setStore} />} />
              <Route path="produk" element={<Products store={store} setStore={setStore} />} />
              <Route path="diskon" element={<Discounts store={store} setStore={setStore} />} />
              <Route path="keuangan" element={<Finance store={store} setStore={setStore} />} />
              <Route path="langganan" element={<SubscriptionPage store={store} setStore={setStore} />} />
              <Route path="profil" element={<AccountProfilePage />} />
              <Route path="pengaturan" element={<AccountSecurityPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
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
