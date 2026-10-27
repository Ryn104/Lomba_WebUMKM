import { Printer, Download, CheckCircle2, X } from 'lucide-react'
import { rupiah, formatDate } from '../../lib/utils'

export default function InvoiceReceiptModal({ invoice, store, onClose }) {
  if (!invoice) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bukti Tagihan</span>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div id="invoice-receipt" className="py-5 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534] mb-3">
            <CheckCircle2 size={28} />
          </span>
          <h3 className="text-xl font-bold text-slate-900">{store?.name || 'Toko UMKM'}</h3>
          <p className="font-mono text-xs text-slate-500 mt-0.5">{invoice.id}</p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tanggal</span>
              <span className="font-medium text-slate-900">{formatDate(invoice.date)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Keterangan</span>
              <span className="font-medium text-slate-900">{invoice.description}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Metode Pembayaran</span>
              <span className="font-medium text-slate-900">{invoice.method || 'QRIS'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Status</span>
              <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2 py-0.5 font-bold text-[#166534]">
                {invoice.status || 'Lunas'}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline font-bold text-sm">
              <span className="text-slate-900">Total Dibayar</span>
              <span className="text-base text-brand-700">{rupiah(invoice.amount)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="btn-secondary flex-1 text-xs"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Cetak Bukti
          </button>
          <button
            type="button"
            className="btn-primary flex-1 text-xs font-bold"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
