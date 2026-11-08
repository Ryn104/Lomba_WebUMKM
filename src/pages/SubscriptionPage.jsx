import { useState, useEffect } from 'react'
import { CreditCard, Crown, Sparkles, Check, FileText, Download, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { planLimits, planPrice, planOf, YEARLY_SAVING_LABEL, isLowerPlan } from '../lib/plans'
import toast from 'react-hot-toast'
import { formatDate, rupiah } from '../lib/utils'
import { useSubscription } from '../hooks/useSubscription'
import UpgradeModal from '../components/subscription/UpgradeModal'
import ComparePlansModal from '../components/subscription/ComparePlansModal'
import InvoiceReceiptModal from '../components/subscription/InvoiceReceiptModal'
import PlanCards from '../components/subscription/PlanCards'
import TrialBanner from '../components/subscription/TrialBanner'
import SegmentedControl from '../components/ui/SegmentedControl'

export default function SubscriptionPage({ store, setStore }) {
  const {
    plan,
    period,
    renewsAt,
    paymentMethod,
    invoices,
    isTrial,
    isExpired,
    isPaid,
    trialDaysLeft,
    trialEndsAt,
    upgrade,
    cancelSubscription,
  } = useSubscription(store, setStore)

  const [productsCount, setProductsCount] = useState(0)
  const [sectionsCount, setSectionsCount] = useState(0)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [targetUpgradePlan, setTargetUpgradePlan] = useState('bisnis')
  const [compareOpen, setCompareOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [billingPeriod, setBillingPeriod] = useState(period === 'yearly' ? 'yearly' : 'monthly')
  const activeLimits = planLimits(plan)

  // Ambil data real produk & section toko
  useEffect(() => {
    if (!store?.id) return
    let alive = true
      ; (async () => {
        const [p, s] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
          supabase.from('store_sections').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
        ])
        if (!alive) return
        if (typeof p.count === 'number') setProductsCount(p.count)
        if (typeof s.count === 'number') setSectionsCount(s.count)
      })()
    return () => {
      alive = false
    }
  }, [store?.id])

  const currentMonthlyPrice = isPaid ? planPrice(plan, period) : null

  const handleOpenUpgrade = (target = 'bisnis') => {
    if (isPaid && isLowerPlan(plan, target)) {
      toast.error(`Anda sudah memiliki paket ${planOf(plan).name}. Tidak dapat membeli paket di bawahnya.`)
      return
    }
    setTargetUpgradePlan(target)
    setUpgradeOpen(true)
  }

  const activePlanName = planOf(plan).name

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Langganan</h1>
          <p className="text-sm text-slate-500">Kelola paket langganan dan akses fitur premium toko Anda.</p>
        </div>

        {isPaid && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            Paket {activePlanName} · {period === 'yearly' ? 'Tahunan' : 'Bulanan'}
          </span>
        )}
        {isTrial && (
          <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">
            Trial 1 Bulan · {trialDaysLeft} hari tersisa
          </span>
        )}
        {isExpired && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            Trial Berakhir · Perlu Langganan
          </span>
        )}
      </div>

      {/* Banner Trial jika masih aktif */}
      {isTrial && (
        <TrialBanner
          trialDaysLeft={trialDaysLeft}
          renewsAt={trialEndsAt}
          onUpgrade={() => handleOpenUpgrade('bisnis')}
        />
      )}

      {/* Banner Peringatan jika Trial Berakhir */}
      {isExpired && (
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Masa uji coba 1 bulan toko Anda telah berakhir
              </h3>
              <p className="mt-0.5 text-xs text-slate-700">
                Pilih paket Basic (10k), Bisnis (30k), atau Pro (50k) agar toko tetap aktif dan fitur premium tetap dapat digunakan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenUpgrade('bisnis')}
            className="btn-primary self-end sm:self-auto px-4 py-2 text-xs sm:text-sm font-bold shadow-sm"
          >
            Pilih Paket Sekarang
          </button>
        </div>
      )}

      {/* Pilihan Paket Langganan */}
      <section className="card relative overflow-hidden p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">Pilih paket yang sesuai kebutuhan toko</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Basic untuk pemula, Bisnis untuk toko berkembang, Pro untuk laporan keuangan lanjutan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="btn-secondary w-full justify-center px-4 py-2 text-xs font-semibold sm:w-auto"
          >
            Bandingkan paket
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center">
          <SegmentedControl
            className="w-full sm:w-auto"
            ariaLabel="Periode penagihan"
            value={billingPeriod}
            onChange={setBillingPeriod}
            options={[
              { id: 'monthly', label: 'Bulanan' },
              { id: 'yearly', label: 'Tahunan' },
            ]}
          />
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-center text-[11px] font-bold text-emerald-800">
            {YEARLY_SAVING_LABEL} dengan paket tahunan
          </span>
        </div>

        <div className="mt-4">
          <PlanCards
            planIds={['basic', 'bisnis', 'pro']}
            period={billingPeriod}
            activePlan={isPaid ? plan : ''}
            onSelect={handleOpenUpgrade}
          />
        </div>
      </section>

      {/* Plan Overview Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Active Plan Card (span 2) */}
        <div className="card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            {/* Header Status */}
            <div className="flex items-start gap-3.5">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isPaid
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : isTrial
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
              >
                {isPaid ? <Crown size={24} /> : isTrial ? <Clock size={24} /> : <CreditCard size={24} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {isPaid ? `Paket ${activePlanName}` : isTrial ? 'Trial 1 Bulan' : 'Masa Uji Coba Berakhir'}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPaid
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : isTrial
                          ? 'border border-blue-200 bg-blue-50 text-blue-800'
                          : 'border border-amber-200 bg-amber-50 text-amber-800'
                      }`}
                  >
                    {isPaid ? 'Aktif' : isTrial ? 'Masa Uji Coba' : 'Kedaluwarsa'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isPaid
                    ? `Paket ${activePlanName} aktif untuk toko Anda.`
                    : isTrial
                      ? `Anda sedang memakai fitur paket Basic selama masa trial 1 bulan gratis (${trialDaysLeft} hari tersisa).`
                      : 'Masa trial 1 bulan telah selesai. Aktifkan paket pilihan Anda untuk terus berjualan.'}
                </p>
              </div>
            </div>

            {/* Info Metrics Row */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-y border-slate-100 py-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Harga</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {isPaid ? `${rupiah(currentMonthlyPrice)} / bulan` : isTrial ? 'Gratis (Trial)' : 'Belum aktif'}
                </p>
              </div>

              {isPaid ? (
                <>
                  <div>
                    <p className="text-slate-400 font-medium">Perpanjangan berikutnya</p>
                    <p className="mt-1 font-bold text-slate-900 text-sm">{renewsAt ? formatDate(renewsAt) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Metode pembayaran</p>
                    <p className="mt-1 font-bold text-slate-900 text-sm">{paymentMethod || '—'}</p>
                  </div>
                </>
              ) : isTrial ? (
                <>
                  <div>
                    <p className="text-slate-400 font-medium">Trial berakhir</p>
                    <p className="mt-1 font-bold text-slate-900 text-sm">{trialEndsAt ? formatDate(trialEndsAt) : '30 hari'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Sisa waktu</p>
                    <p className="mt-1 font-bold text-brand-700 text-sm">{trialDaysLeft} hari</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-slate-400 font-medium">Status toko</p>
                    <p className="mt-1 font-bold text-red-600 text-sm">Trial berakhir</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Paket</p>
                    <p className="mt-1 font-bold text-slate-900 text-sm">Pilih paket</p>
                  </div>
                </>
              )}
            </div>

            {/* Checklist Benefits */}
            <div className="mt-5">
              <p className="text-xs font-bold text-slate-800">
                {isPaid ? 'Fitur yang aktif di paket Anda:' : 'Fitur yang Anda dapatkan saat berlangganan:'}
              </p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs text-slate-700">
                {[
                  'Produk & section website sesuai kuota paket',
                  'Website toko tanpa watermark platform',
                  'Kasir POS untuk transaksi offline',
                  'Laporan keuangan & manajemen kasir',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Check size={11} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            {!isPaid ? (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenUpgrade('bisnis')}
                  className="btn-primary px-5 py-2.5 font-bold shadow-sm"
                >
                  Pilih Paket Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setCompareOpen(true)}
                  className="btn-secondary px-4 py-2.5 text-xs font-semibold"
                >
                  Bandingkan paket
                </button>
              </>
            ) : (
              <>
                {plan !== 'pro' && (
                  <button
                    type="button"
                    onClick={() => handleOpenUpgrade('pro')}
                    className="btn-primary px-5 py-2.5 font-bold shadow-sm"
                  >
                    Upgrade ke Pro
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin membatalkan langganan?')) cancelSubscription()
                  }}
                  className="ml-auto text-xs text-slate-400 hover:text-red-600 transition"
                >
                  Batalkan Langganan
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: "Penggunaan paket" (Usage Stats) */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Penggunaan paket</h3>
            <p className="mt-0.5 text-xs text-slate-500">Pemakaian berdasarkan data toko Anda.</p>

            <div className="mt-6 space-y-5">
              {/* Row 1: Produk */}
              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Produk terdaftar</span>
                  <span className="text-slate-900">
                    {productsCount} {activeLimits.maxProducts === Infinity ? '/ tanpa batas' : `/ ${activeLimits.maxProducts} produk`}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{
                      width: activeLimits.maxProducts === Infinity
                        ? '100%'
                        : `${Math.min((productsCount / activeLimits.maxProducts) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Section Web Builder */}
              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Section Web Builder</span>
                  <span className="text-slate-900">{sectionsCount} section aktif</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Row 3: Website Toko */}
              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Website toko</span>
                  <span className="text-slate-700 font-bold">1 website</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-3">
            <p className="text-[11px] text-slate-400">
              {isPaid
                ? `Paket ${activePlanName} aktif dengan batas kuota sesuai paket Anda.`
                : isTrial
                  ? 'Dalam masa trial 1 bulan, Anda memakai fitur paket Basic.'
                  : 'Aktifkan paket untuk membuka kembali akses fitur toko Anda.'}
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Pembayaran */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-base">Riwayat pembayaran</h3>
          <p className="text-xs text-slate-500">Invoice dan riwayat transaksi langganan Anda.</p>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText size={26} />
            </span>
            <h4 className="text-base font-bold text-slate-800">Belum ada tagihan</h4>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Invoice paket Anda akan muncul di sini setelah transaksi pertama.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Paket</th>
                  <th className="px-5 py-3 text-right">Jumlah</th>
                  <th className="px-5 py-3">Metode</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-3 font-mono text-xs">{invoice.id}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDate(invoice.date)}</td>
                    <td className="px-5 py-3 text-xs font-medium">{invoice.description}</td>
                    <td className="px-5 py-3 text-right text-xs font-bold">{rupiah(invoice.amount)}</td>
                    <td className="px-5 py-3 text-xs">{invoice.method}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        title="Lihat invoice"
                        onClick={() => setSelectedInvoice(invoice)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        targetPlan={targetUpgradePlan}
        currentPlan={isPaid ? plan : ''}
        currentPeriod={billingPeriod}
        onSuccess={({ targetPlan, period: selectedPeriod, method, amount }) =>
          upgrade({ targetPlan, period: selectedPeriod, method, amount })
        }
      />

      <InvoiceReceiptModal invoice={selectedInvoice} store={store} onClose={() => setSelectedInvoice(null)} />

      <ComparePlansModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        currentPlan={isPaid ? plan : ''}
        onSelectPlan={(selectedPlanId) => {
          handleOpenUpgrade(selectedPlanId)
        }}
      />
    </div>
  )
}
