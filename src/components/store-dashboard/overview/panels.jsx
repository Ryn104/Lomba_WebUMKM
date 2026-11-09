import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Globe,
  Package,
  Plus,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { rupiah } from '../../../lib/utils'

/** Panel-panel Ringkasan dashboard toko (grafik, pesanan, produk terlaris, rail kanan). */

const shortRupiah = (value) => {
  const number = Number(value) || 0
  if (Math.abs(number) >= 1000000) {
    return `${(number / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`
  }
  if (Math.abs(number) >= 1000) return `${Math.round(number / 1000)}rb`
  return String(number)
}

export const growthSub = (value, suffix = 'dari bulan lalu') => {
  if (value === null || value === undefined) return 'Belum ada pembanding bulan lalu'
  if (Math.abs(value) < 0.5) return `Stabil ${suffix}`
  return `${value > 0 ? '↑' : '↓'} ${Math.abs(value).toFixed(1).replace('.', ',')}% ${suffix}`
}

export const growthTone = (value) => {
  if (value === null || value === undefined || Math.abs(value) < 0.5) return 'text-slate-500'
  return value > 0 ? 'text-emerald-700' : 'text-red-700'
}

export const relativeTime = (iso) => {
  if (!iso) return ''
  const minutes = Math.max(Math.floor((Date.now() - new Date(iso).getTime()) / 60000), 0)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

const paymentLabel = (method) => ({ cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' }[method] || 'Tunai')

const methodBadge = {
  cash: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  qris: 'border-brand-200 bg-brand-50 text-brand-800',
  transfer: 'border-brand-200 bg-brand-50 text-brand-800',
}

const CardHead = ({ title, desc, action }) => (      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h2>
          {desc && <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">{desc}</p>}
        </div>
        {action}
      </div>
)

const SeeAll = ({ to }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-800">
    Lihat semua <ArrowRight size={13} />
  </Link>
)

/** Grafik penjualan dengan pilihan rentang 7 / 30 hari. */
export function SalesTrendCard({ chart, range, onRangeChange }) {
  const active = chart[range] || chart[7]

  return (
    <section className="card p-4 sm:p-6">
      <CardHead
        title="Grafik penjualan"
        desc={`${range} hari terakhir · ${rupiah(active.total)}`}
        action={
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            {[7, 30].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={range === option}
                onClick={() => onRangeChange(option)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  range === option ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {option} hari
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-3 h-48 sm:mt-4 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={active.series} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="overview-sales-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis
              width={46}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => shortRupiah(value)}
            />
            <Tooltip formatter={(value) => [rupiah(value), 'Penjualan']} />
            <Area
              type="monotone"
              dataKey="omzet"
              name="Penjualan"
              stroke="#047857"
              strokeWidth={2.5}
              fill="url(#overview-sales-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className={`mt-1 text-[11px] font-semibold ${growthTone(active.growth)}`}>
        {growthSub(active.growth, `dibanding ${range} hari sebelumnya`)}
      </p>
    </section>
  )
}

/** Donut komposisi metode pembayaran bulan ini. */
export function SalesSourceCard({ sources, total }) {
  return (
    <section className="card p-4 sm:p-6">
      <CardHead title="Metode pembayaran" desc="Bagian dari omzet bulan ini" />

      {sources.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
          <Wallet size={22} className="text-slate-300" />
          <p className="mt-2 text-xs text-slate-500">Belum ada penjualan bulan ini.</p>
        </div>
      ) : (
        <>
          <div className="relative mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sources} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
                  {sources.map((row) => (
                    <Cell key={row.key} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => rupiah(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="max-w-[84%] truncate text-xs font-extrabold text-slate-900 sm:text-sm">Rp {shortRupiah(total)}</span>
              <span className="text-[10px] text-slate-500">Total omzet</span>
            </div>
          </div>

          <ul className="mt-3 space-y-2.5">
            {sources.map((row) => (
              <li key={row.key} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                  <span className="truncate">{row.name}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold text-slate-900">{row.share.toFixed(0)}%</span>
                  <span className="block text-[10px] text-slate-400">{rupiah(row.value)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/** Tabel 6 transaksi terbaru dari kasir. */
export function RecentTransactionsCard({ rows }) {
  return (
    <section className="card overflow-hidden">
      <div className="p-4 pb-3 sm:p-6 sm:pb-4">
        <CardHead title="Pesanan terbaru" desc="Transaksi terakhir dari kasir POS" action={<SeeAll to="/dashboard/keuangan" />} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 pb-10 text-center">
          <ShoppingCart size={22} className="text-slate-300" />
          <p className="mt-2 text-xs text-slate-500">Belum ada transaksi. Catat penjualan pertama lewat Kasir POS.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2.5 sm:px-5">No. Pesanan</th>
                <th className="px-3 py-2.5 sm:px-5">Metode</th>
                <th className="px-3 py-2.5 text-right sm:px-5">Total</th>
                <th className="px-3 py-2.5 text-right sm:px-5">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-900 sm:px-5">{row.invoice_no}</td>
                  <td className="px-3 py-3 sm:px-5">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${methodBadge[row.payment_method] || methodBadge.cash}`}>
                      {paymentLabel(row.payment_method)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-slate-900 sm:px-5">{rupiah(row.total)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-[11px] text-slate-500 sm:px-5">{relativeTime(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/** Produk terlaris 30 hari terakhir dengan porsi penjualan. */
export function TopProductsCard({ rows }) {
  const maxQty = rows.reduce((max, row) => Math.max(max, row.qty), 0)

  return (
    <section className="card p-4 sm:p-6">
      <CardHead title="Produk terlaris" desc="30 hari terakhir" action={<SeeAll to="/dashboard/produk" />} />

      {rows.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
          <Package size={22} className="text-slate-300" />
          <p className="mt-2 text-xs text-slate-500">Belum ada produk terjual.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <li key={row.key}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {row.image ? (
                    <img src={row.image} alt={row.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <Package size={16} className="text-slate-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{row.name}</p>
                  <p className="text-[11px] text-slate-500">{row.qty} terjual · {rupiah(row.revenue)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  #{index + 1}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                  style={{ width: `${maxQty ? Math.max((row.qty / maxQty) * 100, 8) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const quickLinks = [
  { to: '/builder', icon: Globe, label: 'Atur website toko', desc: 'Kelola tampilan toko online' },
  { to: '/pos', icon: ShoppingCart, label: 'Kasir (POS)', desc: 'Proses transaksi pelanggan' },
  { to: '/dashboard/keuangan', icon: Wallet, label: 'Laporan keuangan', desc: 'Pantau pemasukan & pengeluaran' },
]

/** CTA buat produk + akses cepat menu utama. */
export function QuickActionsCard() {
  return (
    <section className="card p-4 sm:p-5">
      <Link
        to="/dashboard/produk"
        state={{ create: true }}
        className="btn-primary w-full justify-center rounded-full py-2.5 text-sm font-bold shadow-sm"
      >
        <Plus size={16} /> Buat produk baru
      </Link>

      <ul className="mt-3 divide-y divide-slate-100">
        {quickLinks.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="group flex items-center gap-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <item.icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-900">{item.label}</span>
                <span className="block truncate text-[11px] text-slate-500">{item.desc}</span>
              </span>
              <ChevronRight size={15} className="shrink-0 text-slate-300 transition group-hover:text-slate-500" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Status publikasi website toko + tombol aksi. */
export function StoreStatusCard({ store }) {
  const published = Boolean(store.is_published)

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Status website toko</h2>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
            published
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-[#FEF3C7] text-[#92400E]'
          }`}
        >
          {published ? 'Aktif' : 'Draft'}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        {published
          ? 'Website toko kamu sudah online dan bisa diakses pelanggan.'
          : 'Website toko kamu belum dipublikasikan, jadi belum bisa dibuka pelanggan.'}
      </p>

      {published ? (
        <a
          href={`/${store.slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary mt-3 w-full justify-center rounded-full py-2 text-xs font-semibold"
        >
          Lihat website <ArrowRight size={13} />
        </a>
      ) : (
        <Link to="/builder" className="btn-primary mt-3 w-full justify-center rounded-full py-2 text-xs font-bold">
          Publikasikan sekarang <ArrowRight size={13} />
        </Link>
      )}
    </section>
  )
}

const notificationIcon = {
  sale: { icon: CheckCircle2, className: 'text-emerald-600' },
  stock: { icon: AlertTriangle, className: 'text-amber-600' },
}

/** Aktivitas terbaru: transaksi masuk dan stok yang perlu diisi ulang. */
export function NotificationsCard({ items }) {
  return (
    <section className="card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900">Notifikasi terbaru</h2>

      {items.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">Belum ada aktivitas hari ini.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {items.map((item) => {
            const { icon: Icon, className } = notificationIcon[item.type] || notificationIcon.sale
            return (
              <li key={item.id} className="flex items-start gap-2.5 py-2.5">
                <span className={`mt-0.5 shrink-0 ${className}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{item.title}</p>
                  <p className="truncate text-[11px] text-slate-500">{item.desc}</p>
                </div>
                {item.at && <span className="shrink-0 whitespace-nowrap text-[10px] text-slate-400">{relativeTime(item.at)}</span>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** Daftar produk dengan stok ≤ 5. */
export function LowStockCard({ items }) {
  if (items.length === 0) return null

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <AlertTriangle size={15} className="text-amber-600" /> Stok menipis
        </h2>
        <SeeAll to="/dashboard/produk" />
      </div>
      <ul className="mt-2 divide-y divide-slate-100">
        {items.slice(0, 5).map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-2 py-2 text-xs">
            <span className="min-w-0 truncate text-slate-700">{product.name}</span>
            <span className={`shrink-0 font-bold ${product.stock === 0 ? 'text-red-700' : 'text-amber-800'}`}>
              {product.stock === 0 ? 'Habis' : `${product.stock} pcs`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const bannerFeatures = [
  { icon: Globe, label: 'Website toko' },
  { icon: Package, label: 'Manajemen produk' },
  { icon: Wallet, label: 'Keuangan' },
  { icon: ShoppingCart, label: 'Kasir POS' },
]

/** Banner pengingat fitur di bawah panel utama. */
export function GrowthBanner() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-600 p-5 text-white shadow-sm sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <h2 className="text-lg font-bold leading-snug">Saatnya kembangkan bisnis lebih jauh</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/85">
            Website toko, manajemen produk, kasir POS, hingga laporan keuangan — semua bisa kamu kelola dari satu tempat.
          </p>
          <Link
            to="/dashboard/langganan"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-800 shadow-sm transition hover:bg-brand-50"
          >
            Lihat paket & fitur <ArrowRight size={13} />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-2 text-[11px] font-semibold sm:w-64">
          {bannerFeatures.map((feature) => (
            <li key={feature.label} className="flex items-center gap-1.5 rounded-xl bg-white/15 px-2.5 py-2 backdrop-blur-sm">
              <feature.icon size={14} className="shrink-0" />
              <span className="truncate">{feature.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
