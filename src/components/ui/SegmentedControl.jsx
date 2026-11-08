/**
 * Switch bertab dengan indikator geser (dipakai di Langganan, onboarding, dan kartu paket).
 * Indikator memakai transform sehingga perpindahan antar tab bergerak halus, bukan berpindah tiba-tiba.
 */
export default function SegmentedControl({ options = [], value, onChange, ariaLabel, className = '' }) {
  const count = Math.max(options.length, 1)
  const index = Math.max(
    options.findIndex((option) => option.id === value),
    0
  )

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-grid gap-1 rounded-xl border border-slate-200 bg-white p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 top-1 rounded-lg bg-brand-700 shadow-sm transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none"
        style={{
          left: 4,
          width: `calc((100% - 8px - ${(count - 1) * 4}px) / ${count})`,
          transform: `translateX(calc(${index} * 100% + ${index * 4}px))`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          onClick={() => onChange?.(option.id)}
          className={`relative z-10 truncate rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-200 sm:py-1.5 ${
            value === option.id ? 'text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
