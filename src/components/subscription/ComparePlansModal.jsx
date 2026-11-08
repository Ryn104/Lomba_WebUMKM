import { Fragment, useState } from 'react'
import { Check, Minus, Sparkles, X } from 'lucide-react'
import { rupiah } from '../../lib/utils'
import { planLimits, planPrice } from '../../lib/plans'
import ModalLayer from '../ui/ModalLayer'
import SegmentedControl from '../ui/SegmentedControl'

const freeLimits = planLimits('gratis')
const PLAN_IDS = ['gratis', 'bisnis', 'pro']
const GRID = { gridTemplateColumns: 'minmax(0,1.25fr) repeat(3, minmax(0, 1fr))' }

/** Nilai sel perbandingan: centang/minus untuk boolean, teks untuk nilai lain. */
const ValueCell = ({ value, highlight = false }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534]">
        <Check size={13} />
      </span>
    ) : (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Minus size={13} />
      </span>
    )
  }
  return <span className={`text-xs ${highlight ? 'font-semibold text-brand-800' : 'text-slate-800'}`}>{value}</span>
}

const ctaClass = (plan) =>
  plan.disabled
    ? 'cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 text-slate-400'
    : plan.highlight
      ? 'btn-primary rounded-lg shadow-sm'
      : 'btn-secondary rounded-lg'

export default function ComparePlansModal({ open, onClose, currentPlan = 'gratis', onSelectPlan }) {
  const [mobilePlan, setMobilePlan] = useState(currentPlan === 'gratis' ? 'bisnis' : currentPlan)

  if (!open) return null

  const plans = [
    {
      id: 'gratis',
      name: 'Paket Gratis',
      price: 'Rp0',
      period: 'selamanya',
      desc: 'Untuk UMKM yang baru mulai go-online',
      btnText: currentPlan === 'gratis' ? 'Paket aktif saat ini' : 'Pilih Gratis',
      disabled: currentPlan === 'gratis',
      highlight: false,
    },
    {
      id: 'bisnis',
      name: 'Paket Bisnis',
      price: rupiah(planPrice('bisnis')),
      period: 'per bulan',
      badge: 'Paling populer',
      desc: 'Produk tidak terbatas, tanpa watermark, custom domain',
      btnText: currentPlan === 'bisnis' ? 'Paket aktif saat ini' : 'Pilih Bisnis',
      disabled: currentPlan === 'bisnis',
      highlight: true,
    },
    {
      id: 'pro',
      name: 'Paket Pro',
      price: rupiah(planPrice('pro')),
      period: 'per bulan',
      desc: 'Laporan keuangan lanjutan, ekspor CSV & POS tanpa batas',
      btnText: currentPlan === 'pro' ? 'Paket aktif saat ini' : 'Pilih Pro',
      disabled: currentPlan === 'pro',
      highlight: false,
    },
  ]

  const features = [
    { name: 'Batas produk', values: { gratis: `${freeLimits.maxProducts} produk`, bisnis: 'Tanpa batas', pro: 'Tanpa batas' } },
    { name: 'Section Web Builder', values: { gratis: `${freeLimits.maxSections} section`, bisnis: 'Semua section', pro: 'Semua section + template premium' } },
    { name: 'Watermark platform', values: { gratis: 'Ada watermark', bisnis: 'Tanpa watermark', pro: 'Tanpa watermark' } },
    { name: 'Custom domain sendiri', values: { gratis: false, bisnis: true, pro: true } },
    { name: 'Penyimpanan media & foto', values: { gratis: '500 MB', bisnis: '5 GB', pro: '20 GB' } },
    { name: 'Transaksi Kasir POS / bln', values: { gratis: '50 transaksi', bisnis: '500 transaksi', pro: 'Tanpa batas' } },
    { name: 'Laporan keuangan lanjutan & ekspor', values: { gratis: false, bisnis: false, pro: true } },
    { name: 'Multi-cabang & staff kasir', values: { gratis: false, bisnis: false, pro: true } },
  ]

  const selected = plans.find((plan) => plan.id === mobilePlan) || plans[1]

  const pick = (id) => {
    onClose()
    onSelectPlan?.(id)
  }

  return (
    <ModalLayer open={open} onClose={onClose} label="Bandingkan Paket UMKM Builder" backdropLabel="Tutup perbandingan paket">
      <div className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-xl">Bandingkan paket UMKM Builder</h2>
            <p className="mt-0.5 text-xs text-slate-500">Pilih paket yang paling sesuai dengan kebutuhan toko Anda.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {/* ---------- Mobile: satu paket sekaligus lewat switch ---------- */}
          <div className="md:hidden">
            <SegmentedControl
              className="w-full"
              ariaLabel="Pilih paket untuk dibandingkan"
              value={mobilePlan}
              onChange={setMobilePlan}
              options={plans.map((plan) => ({ id: plan.id, label: plan.name.replace('Paket ', '') }))}
            />

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900">{selected.name}</h3>
                  <p className="mt-0.5 text-xs leading-snug text-slate-500">{selected.desc}</p>
                </div>
                {selected.badge && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                    <Sparkles size={9} /> {selected.badge}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">{selected.price}</span>
                <span className="text-xs text-slate-500">/{selected.period}</span>
              </div>

              <button
                type="button"
                disabled={selected.disabled}
                onClick={() => pick(selected.id)}
                className={`mt-3 w-full py-2.5 text-xs font-bold ${ctaClass(selected)}`}
              >
                {selected.btnText}
              </button>
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rincian fitur</p>
            <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {features.map((feature, index) => (
                <div
                  key={feature.name}
                  className={`flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0 ${
                    index % 2 ? 'bg-slate-50/60' : ''
                  }`}
                >
                  <span className="min-w-0 text-xs font-medium text-slate-700">{feature.name}</span>
                  <span className="flex shrink-0 justify-end text-right">
                    <ValueCell value={feature.values[mobilePlan]} highlight={mobilePlan === 'bisnis'} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ---------- Desktop: matriks perbandingan ---------- */}
          <div className="hidden md:block">
            <div className="grid gap-x-3" style={GRID}>
              <div className="flex items-end pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Fitur &amp; benefit
              </div>

              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative mb-3 flex flex-col rounded-2xl border p-3.5 ${
                    plan.highlight ? 'border-brand-700 bg-brand-50/50 ring-1 ring-brand-700' : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                      <Sparkles size={9} /> {plan.badge}
                    </span>
                  )}
                  <h3 className="text-sm font-extrabold text-slate-900">{plan.name}</h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{plan.desc}</p>
                  <div className="mt-2.5 flex flex-wrap items-baseline gap-1">
                    <span className="text-lg font-extrabold tracking-tight text-slate-900">{plan.price}</span>
                    <span className="text-[10px] text-slate-500">/{plan.period}</span>
                  </div>
                  <button
                    type="button"
                    disabled={plan.disabled}
                    onClick={() => pick(plan.id)}
                    className={`mt-auto w-full px-2 py-2 text-[11px] font-bold transition ${ctaClass(plan)}`}
                  >
                    {plan.btnText}
                  </button>
                </div>
              ))}

              {features.map((feature, index) => (
                <Fragment key={feature.name}>
                  <div
                    className={`flex items-center border-t border-slate-100 py-3 pr-2 text-xs font-medium text-slate-700 ${
                      index % 2 ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    {feature.name}
                  </div>
                  {PLAN_IDS.map((planId) => (
                    <div
                      key={planId}
                      className={`flex items-center justify-center border-t border-slate-100 py-3 ${index % 2 ? 'bg-slate-50/50' : ''}`}
                    >
                      <ValueCell value={feature.values[planId]} highlight={planId === 'bisnis'} />
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalLayer>
  )
}
