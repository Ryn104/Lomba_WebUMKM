import { useEffect, useRef, useState } from 'react'

export function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

/** Angka naik perlahan dari 0 saat kartu pertama kali tampil (hanya untuk nilai berupa angka) */
function useCountUp(target, duration = 800) {
  const isNum = typeof target === 'number' && Number.isFinite(target)
  const [val, setVal] = useState(isNum ? 0 : target)
  const first = useRef(true)

  useEffect(() => {
    if (!isNum) {
      setVal(target)
      return undefined
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Animasi hanya di tampilan pertama; perubahan nilai berikutnya langsung ditampilkan
    if (reduce || !first.current) {
      setVal(target)
      first.current = false
      return undefined
    }
    first.current = false
    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, isNum, duration])

  return val
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-[#DCFCE7] text-[#166534]',
    red: 'bg-[#FEE2E2] text-[#991B1B]',
    amber: 'bg-[#FEF3C7] text-[#92400E]',
    info: 'bg-[#DBEAFE] text-[#1D4ED8]',
    neutral: 'bg-[#F1F5F9] text-[#334155]',
  }
  const shown = useCountUp(value)

  return (
    <div className="card group relative overflow-hidden p-5 transition-colors duration-200 hover:border-brand-500/40">
      {/* Cahaya hijau halus di pojok, menyala sedikit saat kartu disorot */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl transition-colors duration-300 group-hover:bg-brand-500/25" />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={`shrink-0 rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${tones[tone] || tones.brand}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="relative mt-3 text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-[1.7rem]">{shown}</p>
      {sub && <p className="relative mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 rounded-full border border-slate-500/20 bg-slate-500/10 p-4 text-slate-400">
          <Icon size={28} />
        </span>
      )}
      <p className="font-semibold text-slate-800">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-slate-500">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner({ full = false }) {
  const el = (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-md" />
      <div className="relative h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
    </div>
  )
  return full ? <div className="app-bg flex h-screen items-center justify-center bg-slate-50">{el}</div> : <div className="flex justify-center py-10">{el}</div>
}