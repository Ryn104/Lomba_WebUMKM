import { AlertTriangle } from 'lucide-react'

export default function DunningBanner({ onRetry, onViewInvoice }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-[#FEF3C7] p-4 text-[#92400E] sm:flex-row sm:items-center sm:justify-between shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/60 text-amber-900">
          <AlertTriangle size={20} />
        </span>
        <div>
          <h4 className="font-bold text-sm text-[#92400E]">Pembayaran paket Bisnis gagal</h4>
          <p className="mt-0.5 text-xs text-amber-800">
            QRIS Anda kedaluwarsa. Perbaiki sebelum 30 Okt 2026 agar paket tidak turun ke Gratis.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={onViewInvoice}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200/50"
        >
          Lihat tagihan
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-amber-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-900 transition"
        >
          Perbaiki pembayaran
        </button>
      </div>
    </div>
  )
}
