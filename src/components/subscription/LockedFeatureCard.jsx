import { Lock, ArrowRight, Sparkles } from 'lucide-react'

export default function LockedFeatureCard({
  title = 'Laporan keuangan lanjutan',
  desc = 'Lihat laba/rugi per cabang, tren bulanan, dan ekspor laporan ke Excel. Upgrade ke Pro untuk membukanya.',
  requiredPlan = 'Pro',
  onUpgrade,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Blurred Mockup Background Graphic */}
      <div className="absolute inset-0 flex items-center justify-around opacity-15 blur-sm pointer-events-none p-6">
        <div className="h-44 w-14 bg-slate-400 rounded-t-xl" />
        <div className="h-28 w-14 bg-slate-400 rounded-t-xl" />
        <div className="h-56 w-14 bg-brand-600 rounded-t-xl" />
        <div className="h-36 w-14 bg-slate-400 rounded-t-xl" />
        <div className="h-48 w-14 bg-slate-400 rounded-t-xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto py-8">
        {/* Lock Circle */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-md text-slate-700">
          <Lock size={26} className="text-brand-700" />
        </div>

        {/* Badge */}
        <span className="mt-4 inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
          <Sparkles size={12} className="text-brand-600" />
          Tersedia di paket {requiredPlan}
        </span>

        <h3 className="mt-3 text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {desc}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onUpgrade}
            className="btn-primary px-5 py-2.5 font-bold shadow-sm"
          >
            Lihat paket {requiredPlan}
          </button>
          <a
            href="#panduan"
            onClick={(e) => {
              e.preventDefault()
              alert('Fitur Laporan Keuangan Pro menyertakan ekspor Excel, analisa margin laba per item, dan multi-cabang!')
            }}
            className="btn-secondary px-4 py-2.5 text-xs font-semibold"
          >
            Pelajari fitur
          </a>
        </div>
      </div>
    </div>
  )
}
