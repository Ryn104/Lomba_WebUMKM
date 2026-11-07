import { Check, Sparkles } from 'lucide-react'
import { isPaidPlan, planOf, planPrice } from '../../lib/plans'
import { rupiah } from '../../lib/utils'

/**
 * Kartu paket berjajar yang dipakai halaman Langganan dan onboarding.
 * Semua harga, fitur, dan label berasal dari src/lib/plans.js.
 */
export default function PlanCards({
  planIds = ['bisnis', 'pro'],
  period = 'monthly',
  activePlan = 'gratis',
  onSelect,
  busyPlan = '',
  columns = 'md:grid-cols-2',
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {planIds.map((id) => {
        const plan = planOf(id)
        const paid = isPaidPlan(id)
        const isActive = activePlan === id
        const isBusy = busyPlan === id
        const price = paid ? planPrice(id, period) : 0
        const highlighted = id === 'pro'

        return (
          <div
            key={id}
            className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${highlighted ? 'border-brand-700 ring-1 ring-brand-700' : 'border-slate-200'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Paket {plan.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{plan.tagline}</p>
              </div>
              {plan.badge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  <Sparkles size={11} /> {plan.badge}
                </span>
              )}
              {isActive && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  Paket aktif
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{rupiah(price)}</span>
              <span className="text-sm text-slate-500">{paid ? '/ bulan' : '/ selamanya'}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {!paid
                ? 'Tanpa biaya, cocok untuk mencoba'
                : period === 'yearly'
                  ? `Ditagih ${rupiah(price * 12)} per tahun`
                  : 'Ditagih setiap bulan'}
            </p>

            <ul className="mt-4 flex-1 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-700">
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
              disabled={isActive || isBusy}
              onClick={() => onSelect?.(id)}
              className={`mt-5 w-full justify-center px-4 py-2.5 text-sm font-bold ${
                isActive || isBusy
                  ? 'cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 text-slate-400'
                  : highlighted
                    ? 'btn-primary shadow-sm'
                    : 'btn-secondary'
              }`}
            >
              {isActive ? 'Paket aktif' : isBusy ? 'Memproses…' : `Pilih ${plan.name}`}
            </button>
          </div>
        )
      })}
    </div>
  )
}
