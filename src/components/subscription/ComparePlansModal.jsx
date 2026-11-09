import { Fragment, useState } from 'react'
import { Check, Minus, Sparkles, X, Lock } from 'lucide-react'
import { rupiah } from '../../lib/utils'
import { planLimits, planPrice, isLowerPlan } from '../../lib/plans'
import ModalLayer from '../ui/ModalLayer'
import SegmentedControl from '../ui/SegmentedControl'

const PLAN_IDS = ['basic', 'bisnis', 'pro']
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

export default function ComparePlansModal({ open, onClose, currentPlan = 'basic', onSelectPlan }) {
  const [mobilePlan, setMobilePlan] = useState(currentPlan === 'basic' ? 'bisnis' : currentPlan)

  if (!open) return null

  const buildPlanMeta = (id, name, desc, badge = null, highlight = false) => {
    const isCurrent = currentPlan === id
    const isLower = isLowerPlan(currentPlan, id)
    return {
      id,
      name,
      price: rupiah(planPrice(id)),
      period: 'per bulan',
      badge,
      desc,
      btnText: isCurrent
        ? 'Paket aktif saat ini'
        : isLower
          ? 'Sudah tercakup'
          : `Pilih ${id === 'basic' ? 'Basic' : id === 'bisnis' ? 'Bisnis' : 'Pro'}`,
      disabled: isCurrent || isLower,
      highlight: highlight && !isCurrent && !isLower,
      isLower,
    }
  }

  const plans = [
    buildPlanMeta('basic', 'Paket Basic', 'Untuk UMKM pemula yang baru mulai online', null, false),
    buildPlanMeta('bisnis', 'Paket Bisnis', 'Kuota produk lebih besar, tanpa watermark, custom domain', 'Paling populer', true),
    buildPlanMeta('pro', 'Paket Pro', 'Laporan keuangan lanjutan & POS tanpa batas', 'Fitur lengkap', false),
  ]

  // Semua nilai diambil dari src/lib/plans.js agar angka tidak disalin ulang di UI.
  const limitOf = (id) => planLimits(id)
  const valuesOf = (read) => Object.fromEntries(PLAN_IDS.map((id) => [id, read(limitOf(id))]))
  const productLimitLabel = (limits) => (limits.maxProducts === Infinity ? 'Tanpa batas' : `${limits.maxProducts} produk`)

  const features = [
    { name: 'Batas produk', values: valuesOf(productLimitLabel) },
    { name: 'Section Web Builder', values: valuesOf((limits) => (limits.maxSections === Infinity ? 'Semua section' : `${limits.maxSections} section`)) },
    { name: 'Watermark platform', values: valuesOf((limits) => (limits.hasWatermark ? 'Ada watermark' : 'Tanpa watermark')) },
    { name: 'Custom domain toko', values: valuesOf((limits) => limits.hasCustomDomain) },
    { name: 'Penyimpanan media & foto', values: valuesOf((limits) => `${limits.maxImagesGB} GB`) },
    { name: 'Transaksi Kasir POS', values: valuesOf(() => 'Tanpa batas') },
    { name: 'Laporan keuangan & laba rugi', values: valuesOf((limits) => limits.hasAdvancedFinance) },
    { name: 'Ekspor laporan keuangan (CSV)', values: valuesOf((limits) => limits.hasCsvExport) },
  ]

  const selected = plans.find((plan) => plan.id === mobilePlan) || plans[1]

  const pick = (id) => {
    if (isLowerPlan(currentPlan, id)) return
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
                {selected.badge && !selected.isLower && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                    <Sparkles size={9} /> {selected.badge}
                  </span>
                )}
                {selected.isLower && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">
                    <Lock size={9} /> Di bawah paket aktif
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
                className={`mt-3 w-full py-2 text-xs font-bold ${ctaClass(selected)}`}
              >
                {selected.btnText}
              </button>

              <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-xs">
                {features.map((feature) => (
                  <div key={feature.name} className="flex items-center justify-between py-2">
                    <dt className="text-slate-600">{feature.name}</dt>
                    <dd className="font-medium text-slate-900">
                      <ValueCell value={feature.values[selected.id]} highlight={selected.highlight} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* ---------- Desktop (md+): tabel 4 kolom seperti semula ---------- */}
          <div className="hidden md:block">
            <div className="grid border-b border-slate-200 pb-4" style={GRID}>
              <div />
              {plans.map((plan) => (
                <div key={plan.id} className="relative px-3 text-center">
                  {plan.badge && !plan.isLower && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                      {plan.badge}
                    </span>
                  )}
                  {plan.isLower && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">
                      <Lock size={9} /> Di bawah paket aktif
                    </span>
                  )}
                  <h3 className="font-extrabold text-slate-900">{plan.name}</h3>
                  <div className="mt-1">
                    <span className="text-xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-500">/{plan.period}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 min-h-[32px] text-[11px] text-slate-500">{plan.desc}</p>
                  <button
                    type="button"
                    disabled={plan.disabled}
                    onClick={() => pick(plan.id)}
                    className={`mt-3 w-full py-2 text-xs font-bold ${ctaClass(plan)}`}
                  >
                    {plan.btnText}
                  </button>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {features.map((f, i) => (
                <div
                  key={f.name}
                  className={`grid items-center py-3 ${i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}
                  style={GRID}
                >
                  <span className="px-3 font-semibold text-slate-700">{f.name}</span>
                  {PLAN_IDS.map((id) => (
                    <div key={id} className="px-3 text-center">
                      <ValueCell value={f.values[id]} highlight={id === 'bisnis'} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalLayer>
  )
}
