import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'
import PlanCards from '../subscription/PlanCards'
import { YEARLY_SAVING_LABEL } from '../../lib/plans'

/** Langkah 2 onboarding: pilih paket (Gratis/Bisnis/Pro) atau lewati ke Gratis. */
export default function PlanStep({ period, setPeriod, onPick, onBack, busy = false }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Pilih paket langganan</h2>
        <p className="text-sm text-slate-500">
          Mulai dengan Gratis, atau aktifkan Bisnis/Pro sekarang. Paket bisa diubah kapan saja dari halaman Langganan.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {[
            { id: 'monthly', label: 'Bulanan' },
            { id: 'yearly', label: 'Tahunan' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={period === option.id}
              onClick={() => setPeriod(option.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${period === option.id ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
          {YEARLY_SAVING_LABEL} dengan paket tahunan
        </span>
      </div>

      <PlanCards
        planIds={['gratis', 'bisnis', 'pro']}
        period={period}
        activePlan=""
        onSelect={onPick}
        busyPlan={busy ? 'bisnis' : ''}
        columns="md:grid-cols-3"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onBack} className="btn-secondary px-4 py-2 text-sm font-semibold">
          <ArrowLeft size={16} /> Kembali
        </button>
        <button
          type="button"
          onClick={() => onPick('gratis')}
          disabled={busy}
          className="btn-ghost px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-60"
        >
          <SkipForward size={16} /> Lewati, pakai Gratis
        </button>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-slate-500">
        <ArrowRight size={14} className="mt-0.5 shrink-0" />
        Langkah ini bisa dilewati. Toko Anda tetap aktif dengan paket Gratis dan bisa di-upgrade nanti.
      </p>
    </div>
  )
}
