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
.sd-stagger > div > .grid > *:nth-child(n+4) { animation-delay: 280ms; }

/* Kartu, tabel, dan tombol */
.store-scope .card { transition: box-shadow .25s ease, border-color .25s ease; }
.store-scope .card:hover { box-shadow: 0 14px 34px -16px rgba(2, 6, 23, .28); }
.store-scope thead th { font-weight: 600; letter-spacing: .05em; }
.store-scope tbody tr { transition: background-color .15s ease; }
.store-scope .btn-primary, .store-scope .btn-secondary { border-radius: 9999px; }

/* Judul halaman: lebih besar + teks kecil hijau di atasnya (halaman akun sudah punya sendiri, jadi dikecualikan) */
.store-scope h1.text-2xl:not(.tracking-tight) { font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; letter-spacing: -0.025em; }
.store-scope h1.text-2xl:not(.tracking-tight)::before {
  content: 'Dashboard Toko';
  display: block;
  margin-bottom: .25rem;
  font-size: .875rem;
  line-height: 1.25rem;
  font-weight: 600;
  letter-spacing: 0;
  color: #059669;
}

@media (prefers-reduced-motion: reduce) {
  .sd-drift, .sd-stagger > div > *, .sd-stagger > div > .grid > * { animation: none !important; }
}
`

export default function StoreDashboard() {
  const { store, setStore, loading } = useMyStore()
  const { plan, upgrade } = useSubscription(store, setStore)
  const { isDark } = useTheme()
  const location = useLocation()
  const nav = useNavigate()
  const [productsCount, setProductsCount] = useState(0)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => {
    if (!store?.id) return
    let alive = true
      ; (async () => {
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
  // Pengguna baru (belum punya toko) menyelesaikan wizard onboarding,
  // bukan formulir CreateStore di dalam dashboard.
  if (!store) return <Navigate to="/onboarding" replace />

  const isFree = plan === 'gratis'
  const atLimit = isFree && productsCount >= 10

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
            {!isFree && <Crown size={13} className="text-brand-500" />}
            {plan === 'pro' ? 'Paket Pro' : plan === 'bisnis' ? 'Paket Bisnis' : 'Paket Gratis'}
          </span>
          <span className={w.muted}>
            {isFree ? `${productsCount}/10 produk` : 'Tanpa batas'}
          </span>
        </div>
        <div className={`relative mt-2 h-1.5 w-full overflow-hidden rounded-full ${w.track}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${atLimit ? 'bg-red-500' : 'bg-gradient-to-r from-brand-600 to-brand-400'}`}
            style={{ width: isFree ? `${Math.min((productsCount / 10) * 100, 100)}%` : '100%' }}
          />
        </div>
        {isFree && (
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="relative mt-3 w-full rounded-full bg-gradient-to-r from-brand-700 to-brand-600 py-2 text-center font-bold text-white shadow-md shadow-brand-700/25 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Upgrade paket
          </button>
        )}
      </div>
    </div>
  )

  const planBadge =
    plan === 'pro'
      ? 'border-[#BBF7D0] bg-[#DCFCE7] text-[#166534]'
      : plan === 'bisnis'
        ? 'border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]'
        : 'border-[#E2E8F0] bg-[#F1F5F9] text-[#334155]'

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
          <div className="flex items-center gap-2">
            {/* Badge status paket */}
            <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${planBadge}`}>
              {!isFree && <Crown size={12} />}
              {plan === 'pro' ? 'Pro' : plan === 'bisnis' ? 'Bisnis' : 'Gratis'}
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
              className="btn-secondary !rounded-full"
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
        {/* Latar konten: pola titik tipis + cahaya hijau lembut, seperti hero landing page */}
        <div className="store-scope relative isolate min-h-full">
          <div className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
          <div className="sd-drift pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

          {/* key = path, jadi tiap pindah menu konten muncul dengan animasi halus */}
          <div key={location.pathname} className="sd-stagger">
            <Routes>
              <Route index element={<Overview store={store} />} />
              <Route path="produk" element={<Products store={store} setStore={setStore} />} />
              <Route path="diskon" element={<Discounts store={store} />} />
              <Route path="keuangan" element={<Finance store={store} setStore={setStore} />} />
              <Route path="langganan" element={<SubscriptionPage store={store} setStore={setStore} />} />
              <Route path="profil" element={<AccountProfilePage />} />
              <Route path="pengaturan" element={<AccountSecurityPage store={store} setStore={setStore} />} />
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