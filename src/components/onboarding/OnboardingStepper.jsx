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
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-brand-700 text-white'
                    : active
                      ? 'border-2 border-brand-700 bg-white text-brand-700'
                      : 'border border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {done ? '✓' : item.id}
              </span>
              <span
                className={`truncate text-[11px] font-semibold sm:text-xs ${
                  active ? 'text-slate-900' : done ? 'text-brand-700' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">Langkah {step} dari {STEPS.length}</p>
    </div>
  )
}
