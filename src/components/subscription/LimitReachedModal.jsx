import { AlertTriangle } from 'lucide-react'
import ModalLayer from '../ui/ModalLayer'

export default function LimitReachedModal({
  open,
  onClose,
  currentCount = 50,
  maxCount = 50,
  onUpgrade,
}) {
  if (!open) return null

  return (
    <ModalLayer open onClose={onClose} label={`Batas ${maxCount} produk tercapai`}>
      <div className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
        {/* Warning Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF3C7] text-[#92400E] border border-amber-200">
          <AlertTriangle size={28} />
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900">Batas {maxCount} produk tercapai</h3>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Paket Anda saat ini memiliki batas {maxCount} produk. Upgrade ke paket Bisnis atau Pro untuk produk tanpa batas, atau nonaktifkan produk lama.
        </p>

        {/* Progress Bar */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">Produk digunakan</span>
            <span className="text-red-600">{currentCount}/{maxCount} produk</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-full rounded-full bg-red-600" />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose()
              onUpgrade?.()
            }}
            className="btn-primary w-full py-2.5 font-bold shadow-sm"
          >
            Upgrade Paket
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full py-2.5 font-semibold text-slate-600"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </ModalLayer>
  )
}
