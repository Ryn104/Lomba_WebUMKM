import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import PlanCards from '../subscription/PlanCards'
import SegmentedControl from '../ui/SegmentedControl'
import { YEARLY_SAVING_LABEL } from '../../lib/plans'

export default function PlanStep({ period, setPeriod, onPick, onBack, busy = false }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Pilih paket langganan</h2>
        <p className="text-sm text-slate-500">
          Semua pendaftaran baru mendapatkan <b>Trial 1 Bulan Gratis</b> dengan fitur paket Basic. Anda juga bisa langsung mengaktifkan paket Basic (10k), Bisnis (30k), atau Pro (50k).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          className="w-full sm:w-auto"
          ariaLabel="Periode penagihan"
          value={period}
          onChange={setPeriod}
          options={[
            { id: 'monthly', label: 'Bulanan' },
            { id: 'yearly', label: 'Tahunan' },
          ]}
        />
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
          {YEARLY_SAVING_LABEL} dengan paket tahunan
        </span>
      </div>

      <PlanCards
        planIds={['basic', 'bisnis', 'pro']}
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
          onClick={() => onPick('trial')}
          disabled={busy}
          className="btn-primary px-4 py-2 text-sm font-bold shadow-sm disabled:opacity-60"
        >
          <Sparkles size={16} /> Mulai Trial 1 Bulan Gratis
        </button>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-slate-500">
        <ArrowRight size={14} className="mt-0.5 shrink-0" />
        Nikmati masa uji coba 1 bulan gratis tanpa kartu kredit. Paket langganan dapat diubah atau diaktifkan kapan saja dari dashboard.
      </p>
    </div>
  )
}
