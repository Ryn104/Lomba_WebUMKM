import { useState, useEffect } from 'react'
import { CreditCard, Crown, Sparkles, Check, FileText, Download, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, rupiah } from '../lib/utils'
import { useSubscription } from '../hooks/useSubscription'
import UpgradeModal from '../components/subscription/UpgradeModal'
import ComparePlansModal from '../components/subscription/ComparePlansModal'
import InvoiceReceiptModal from '../components/subscription/InvoiceReceiptModal'

export default function SubscriptionPage({ store, setStore }) {
  const {
    plan,
    period,
    renewsAt,
    paymentMethod,
    invoices,
    promoDismissed,
    upgrade,
    cancelSubscription,
    dismissPromo,
  } = useSubscription(store, setStore)

  const [productsCount, setProductsCount] = useState(0)
  const [sectionsCount, setSectionsCount] = useState(0)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [targetUpgradePlan, setTargetUpgradePlan] = useState('bisnis')
  const [compareOpen, setCompareOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Ambil data real produk & section toko
  useEffect(() => {
    if (!store?.id) return
    let alive = true
    ;(async () => {
      const [p, s] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
        supabase.from('store_sections').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
      ])
      if (!alive) return
      if (typeof p.count === 'number') setProductsCount(p.count)
      if (typeof s.count === 'number') setSectionsCount(s.count)
    })()
    return () => { alive = false }
  }, [store?.id])

  const isPaid = plan === 'bisnis' || plan === 'pro'

  const handleOpenUpgrade = (target = 'bisnis') => {
    setTargetUpgradePlan(target)
    setUpgradeOpen(true)
  }

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
            Paket aktif · {period === 'yearly' ? 'tahunan' : 'bulanan'}
          </span>
        )}
      </div>

      {/* Ajakan upgrade untuk paket Gratis */}
      {plan === 'gratis' && !promoDismissed && (
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 sm:p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Sparkles size={20} />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Buka semua section dan hilangkan watermark
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Akses produk tanpa batas, semua section website, dan tampilan toko tanpa watermark.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleOpenUpgrade('bisnis')}
              className="btn-primary px-4 py-2 text-xs sm:text-sm font-bold shadow-sm"
            >
              Lihat Paket Bisnis
            </button>
            <button
              type="button"
              onClick={dismissPromo}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-100 hover:text-slate-700"
              title="Tutup banner"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Plan Overview Grid (Mockup 1 & 4) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Active Plan Card (span 2) */}
        <div className="card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            {/* Header Status */}
            <div className="flex items-start gap-3.5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isPaid ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {isPaid ? <Crown size={24} /> : <CreditCard size={24} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {plan === 'pro' ? 'Paket Pro' : plan === 'bisnis' ? 'Paket Bisnis' : 'Paket Gratis'}
                  </h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isPaid
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-slate-200 bg-slate-100 text-slate-700'
                  }`}>
                    Aktif
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isPaid
                    ? `Paket ${plan === 'pro' ? 'Pro' : 'Bisnis'} untuk toko Anda.`
                    : 'Mulai berjualan online dengan fitur dasar tanpa biaya.'}
                </p>
              </div>
            </div>

            {/* Info Metrics Row */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-y border-slate-100 py-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Harga</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {isPaid
                    ? period === 'yearly'
                      ? `${rupiah(plan === 'pro' ? 119000 : 63000)} / bulan`
                      : `${rupiah(plan === 'pro' ? 149000 : 79000)} / bulan`
                    : 'Rp0 / selamanya'}
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
              ) : (
                <>
                  <div>
                    <p className="text-slate-400 font-medium">Batas produk</p>
                    <p className="mt-1 font-bold text-slate-900 text-sm">10 produk</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Watermark platform</p>
                    <p className="mt-1 font-bold text-slate-900 text-sm">Aktif</p>
                  </div>
                </>
              )}
            </div>

            {/* Checklist Benefits */}
            <div className="mt-5">
              <p className="text-xs font-bold text-slate-800">
                {isPaid ? 'Fitur yang aktif di paket Anda:' : 'Fitur yang tersedia saat upgrade:'}
              </p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs text-slate-700">
                {[
                  'Produk tanpa batas',
                  'Section website tanpa batas',
                  'Website tanpa watermark',
                  ...(plan === 'pro' ? ['Ringkasan keuangan dan unduh CSV'] : []),
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
                  Upgrade ke Bisnis
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
                    if (window.confirm('Kembalikan akses toko ke Paket Gratis?')) cancelSubscription()
                  }}
                  className="ml-auto text-xs text-slate-400 hover:text-red-600 transition"
                >
                  Kembali ke Paket Gratis
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
              {/* Row 1: Produk atau Media Storage */}
              {!isPaid ? (
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Produk digunakan</span>
                    <span className={productsCount >= 10 ? 'text-red-600' : 'text-slate-900'}>
                      {productsCount}/10 produk
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        productsCount >= 10 ? 'bg-red-600' : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min((productsCount / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Produk digunakan</span>
                    <span className="text-slate-900">{productsCount} / tanpa batas</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: '100%' }} />
                  </div>
                </div>
              )}

              {/* Row 2: Section Web Builder atau POS Transactions */}
              {!isPaid ? (
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Section Web Builder</span>
                    <span className={sectionsCount >= 3 ? 'text-red-600' : 'text-slate-900'}>
                      {sectionsCount}/3 section
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        sectionsCount >= 3 ? 'bg-red-600' : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min((sectionsCount / 3) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Transaksi POS bulan ini</span>
                    <span className="text-slate-500">Belum ada data</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-300" style={{ width: '0%' }} />
                  </div>
                </div>
              )}

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
                ? 'Penggunaan produk dan section tidak dibatasi pada paket ini.'
                : 'Aktifkan paket untuk membuka batas produk dan section.'}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Riwayat Pembayaran (Mockup 1 & 4) */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-base">Riwayat pembayaran</h3>            <p className="text-xs text-slate-500">Invoice dan riwayat transaksi langganan Anda.</p>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileText size={26} /></span>
            <h4 className="text-base font-bold text-slate-800">Belum ada tagihan</h4>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">Invoice paket Anda akan muncul di sini setelah transaksi pertama.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3">Paket</th><th className="px-5 py-3 text-right">Jumlah</th><th className="px-5 py-3">Metode</th><th className="px-5 py-3">Status</th><th className="px-5 py-3" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-3 font-mono text-xs">{invoice.id}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDate(invoice.date)}</td>
                    <td className="px-5 py-3 text-xs font-medium">{invoice.description}</td>
                    <td className="px-5 py-3 text-right text-xs font-bold">{rupiah(invoice.amount)}</td>
                    <td className="px-5 py-3 text-xs">{invoice.method}</td>
                    <td className="px-5 py-3"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">{invoice.status}</span></td>
                    <td className="px-5 py-3"><button type="button" title="Lihat invoice" onClick={() => setSelectedInvoice(invoice)} className="rounded p-1 text-slate-500 hover:bg-slate-100"><Download size={16} /></button></td>
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
        currentPeriod={period}
        onSuccess={({ targetPlan, period: selectedPeriod, method, amount }) => upgrade({ targetPlan, period: selectedPeriod, method, amount })}
      />

      <InvoiceReceiptModal invoice={selectedInvoice} store={store} onClose={() => setSelectedInvoice(null)} />

      <ComparePlansModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        currentPlan={plan}
        onSelectPlan={(selectedPlanId) => {
          if (selectedPlanId !== 'gratis') {
            handleOpenUpgrade(selectedPlanId)
          }
        }}
      />

    </div>
  )
}
