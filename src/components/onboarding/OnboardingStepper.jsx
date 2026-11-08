const STEPS = [
  { id: 1, label: 'Nama toko' },
  { id: 2, label: 'Pilih paket' },
  { id: 3, label: 'Selesai' },
]

/** Indikator progres wizard onboarding (mobile-first). */
export default function OnboardingStepper({ step = 1 }) {
  const percent = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((item) => {
          const done = step > item.id
          const active = step === item.id
          return (
            <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                  done
                    ? 'bg-brand-700 text-white'
                    : active
                      ? 'border-2 border-brand-600 bg-brand-500/10 text-brand-600'
                      : 'border border-slate-500/30 bg-slate-500/10 text-slate-500'
                }`}
              >
                {done ? '✓' : item.id}
              </span>
              <span
                className={`truncate text-[11px] font-semibold sm:text-xs ${
                  active ? 'text-slate-900' : done ? 'text-brand-600' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-500/20">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">Langkah {step} dari {STEPS.length}</p>
    </div>
  )
}