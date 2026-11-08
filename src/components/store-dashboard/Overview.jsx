import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Package, ReceiptText, TrendingUp, Wallet } from 'lucide-react'
import { StatCard, Spinner } from '../ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useDashboardSummary } from './overview/useDashboardSummary'
import {
  GrowthBanner,
  LowStockCard,
  NotificationsCard,
  QuickActionsCard,
  RecentTransactionsCard,
  SalesSourceCard,
  SalesTrendCard,
  StoreStatusCard,
  TopProductsCard,
  growthSub,
  growthTone,
} from './overview/panels'
import { rupiah } from '../../lib/utils'

const greetingForHour = (hour) => {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default function Overview({ store, isPaid, plan }) {
  const { profile } = useAuth()
  const showGrowthBanner = !(isPaid && (plan === 'bisnis' || plan === 'pro'))
  const [range, setRange] = useState(7)
  const { loading, error, data } = useDashboardSummary(store.id)

  if (loading && !data) return <Spinner />

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Gagal memuat ringkasan toko</p>
        <p className="mt-1 text-xs text-slate-500">Periksa koneksi lalu muat ulang halaman ini.</p>
      </div>
    )
  }

  const now = new Date()
  const firstName = (profile?.full_name || store.name || '').trim().split(' ')[0]
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  const { stats, chart, sources, salesTotal, recent, topProducts, lowStock, notifications } = data

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sapaan + tanggal hari ini */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {greetingForHour(now.getHours())}, {firstName}
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">Berikut ringkasan bisnis {store.name} hari ini.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-600 shadow-sm sm:text-xs">
          <CalendarDays size={14} className="text-brand-700" /> {dateLabel}
        </span>
      </div>

      {/* Peringatan draft (mobile; di desktop sudah ada kartu status di rail kanan) */}
      {!store.is_published && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-[#FEF3C7] p-4 xl:hidden">
          <p className="text-xs text-[#92400E] sm:text-sm">
            Website toko Anda masih <b>draft</b>. Publikasikan agar bisa diakses pelanggan.
          </p>
          <Link to="/builder" className="btn-primary px-4 py-2 text-xs">
            Buka Web Builder
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Kolom utama */}
        <div className="space-y-4 sm:space-y-6">
          {/* Aksi cepat di atas untuk mobile; di desktop pindah ke rail kanan */}
          <div className="xl:hidden">
            <QuickActionsCard />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
            <StatCard
              icon={TrendingUp}
              tone="green"
              label="Penjualan bulan ini"
              value={rupiah(stats.sales.total)}
              sub={growthSub(stats.sales.growth)}
              subTone={growthTone(stats.sales.growth)}
            />
            <StatCard
              icon={ReceiptText}
              tone="info"
              label="Transaksi bulan ini"
              value={stats.orders.total}
              sub={growthSub(stats.orders.growth)}
              subTone={growthTone(stats.orders.growth)}
            />
            <StatCard
              icon={Package}
              tone="brand"
              label="Produk terjual"
              value={stats.sold.total}
              sub="30 hari terakhir"
            />
            <StatCard
              icon={Wallet}
              tone="amber"
              label="Laba bersih bulan ini"
              value={rupiah(stats.profit.total)}
              sub={growthSub(stats.profit.growth)}
              subTone={growthTone(stats.profit.growth)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SalesTrendCard chart={chart} range={range} onRangeChange={setRange} />
            </div>
            <div className="lg:col-span-2">
              <SalesSourceCard sources={sources} total={salesTotal} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RecentTransactionsCard rows={recent} />
            </div>
            <div className="lg:col-span-2">
              <TopProductsCard rows={topProducts} />
            </div>
          </div>

          {showGrowthBanner && <GrowthBanner />}
        </div>

        {/* Rail kanan */}
        <aside className="space-y-4 sm:space-y-6">
          <div className="hidden xl:block">
            <QuickActionsCard />
          </div>
          <div className="hidden xl:block">
            <StoreStatusCard store={store} />
          </div>
          <NotificationsCard items={notifications} />
          <LowStockCard items={lowStock} />
        </aside>
      </div>
    </div>
  )
}
