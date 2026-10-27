import { Sparkles } from 'lucide-react'

export default function UsageNudge({ currentCount = 9, maxCount = 10, onUpgrade }) {
  const remaining = Math.max(maxCount - currentCount, 0)
  const percent = Math.min(Math.round((currentCount / maxCount) * 100), 100)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        {/* Progress block */}
        <div className="w-40 shrink-0">
          <div className="flex justify-between text-xs font-semibold text-slate-800">
            <span>Produk digunakan</span>
            <span className={currentCount >= maxCount ? 'text-red-600' : 'text-slate-900'}>
              {currentCount}/{maxCount} produk
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                currentCount >= maxCount ? 'bg-red-600' : currentCount >= 8 ? 'bg-amber-500' : 'bg-brand-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900">
            {remaining === 0 ? 'Batas produk paket Gratis telah tercapai' : `Sisa ${remaining} slot produk di paket Gratis`}
          </p>
          <p className="text-[11px] text-slate-500 truncate">Upgrade ke Bisnis untuk produk tidak terbatas.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onUpgrade}
        className="btn-secondary self-end sm:self-auto px-3 py-1.5 text-xs font-bold"
      >
        Lihat paket
      </button>
    </div>
  )
}
