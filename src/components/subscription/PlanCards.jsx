import { useState } from 'react'
import { Check, Sparkles, Lock } from 'lucide-react'
import { isPaidPlan, planOf, planPrice, isLowerPlan } from '../../lib/plans'
import { rupiah } from '../../lib/utils'
import SegmentedControl from '../ui/SegmentedControl'

/**
 * Kartu paket berjajar yang dipakai halaman Langganan dan onboarding.
 * Semua harga, fitur, dan label berasal dari src/lib/plans.js.
 *
 * Mobile: kartu tidak ditumpuk, cukup tampil satu paket dengan switch di atasnya.
 * Desktop (md+): semua kartu tampil berdampingan seperti biasa.
 */
export default function PlanCards({
  planIds = ['basic', 'bisnis', 'pro'],
  period = 'monthly',
  activePlan = '',
  onSelect,
  busyPlan = '',
  columns = 'md:grid-cols-3',
}) {
  const [mobilePlan, setMobilePlan] = useState(() =>
    planIds.includes(activePlan) ? activePlan : planIds[0]
  )

  return (
    <div>
      <style>{`
        @keyframes pc-mobile-in { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }
        .pc-mobile-in { animation: pc-mobile-in .22s ease-out; }
        @media (prefers-reduced-motion: reduce) { .pc-mobile-in { animation: none; } }
      `}</style>

      {/* Switch paket (hanya mobile) */}
      <SegmentedControl
        className="mb-3 w-full md:hidden"
        ariaLabel="Pilih paket yang ingin dilihat"
        value={mobilePlan}
        onChange={setMobilePlan}
        options={planIds.map((id) => ({ id, label: planOf(id).name }))}
      />

      <div className={`grid gap-4 ${columns}`}>
        {planIds.map((id) => {
          const plan = planOf(id)
          const paid = isPaidPlan(id)
          const isActive = activePlan === id
          const isBusy = busyPlan === id
          const isLower = isLowerPlan(activePlan, id)
          const isDisabled = isActive || isBusy || isLower
          const price = planPrice(id, period)
          const highlighted = id === 'bisnis' && !isActive && !isLower
          const isMobileActive = mobilePlan === id

          return (
            <div
              key={id}
              className={`flex-col rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                isMobileActive ? 'pc-mobile-in flex' : 'hidden'
              } md:flex ${
                isLower
                  ? 'border-slate-200 bg-slate-50/70 opacity-80'
                  : highlighted
                    ? 'border-brand-700 ring-1 ring-brand-700'
                    : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">Paket {plan.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{plan.tagline}</p>
                </div>
                {plan.badge && !isLower && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    <Sparkles size={11} /> {plan.badge}
                  </span>
                )}
                {isActive && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                    Paket aktif
                  </span>
                )}
                {isLower && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                    <Lock size={10} /> Di bawah paket aktif
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 sm:mt-4">
                <span className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{rupiah(price)}</span>
                <span className="text-xs text-slate-500 sm:text-sm">/ bulan</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {period === 'yearly'
                  ? `Ditagih ${rupiah(price * 12)} per tahun`
                  : 'Ditagih setiap bulan'}
              </p>

              <ul className="mt-3 flex-1 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-700 sm:mt-4 sm:pt-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Check size={11} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelect?.(id)}
                title={isLower ? 'Anda sudah memiliki paket yang lebih tinggi dari paket ini' : undefined}
                className={`mt-4 w-full justify-center px-4 py-2.5 text-sm font-bold sm:mt-5 ${
                  isDisabled
                    ? 'cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 text-slate-400'
                    : highlighted
                      ? 'btn-primary shadow-sm'
                      : 'btn-secondary'
                }`}
              >
                {isActive
                  ? 'Paket aktif'
                  : isLower
                    ? 'Sudah tercakup di paket aktif'
                    : isBusy
                      ? 'Memproses…'
                      : `Pilih ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
