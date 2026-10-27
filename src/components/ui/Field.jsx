export function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
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
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={`rounded-lg p-2 ${tones[tone] || tones.brand}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && <Icon size={36} className="mb-3 text-slate-400" />}
      <p className="font-semibold text-slate-800">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-slate-500">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner({ full = false }) {
  const el = <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
  return full ? <div className="flex h-screen items-center justify-center bg-slate-50">{el}</div> : <div className="flex justify-center py-10">{el}</div>
}
