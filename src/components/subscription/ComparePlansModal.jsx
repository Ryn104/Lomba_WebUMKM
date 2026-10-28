import { X, Check, Minus } from 'lucide-react'
import { rupiah } from '../../lib/utils'
import ModalLayer from '../ui/ModalLayer'

export default function ComparePlansModal({ open, onClose, currentPlan = 'gratis', onSelectPlan }) {
  if (!open) return null

  const plans = [
    {
      id: 'gratis',
      name: 'Paket Gratis',
      price: 'Rp0',
      period: 'selamanya',
      desc: 'Untuk UMKM yang baru mulai go-online',
      btnText: currentPlan === 'gratis' ? 'Paket Aktif Saat Ini' : 'Pilih Gratis',
      disabled: currentPlan === 'gratis',
      highlight: false,
    },
    {
      id: 'bisnis',
      name: 'Paket Bisnis',
      price: 'Rp79.000',
      period: 'per bulan',
      badge: 'Paling Populer',
      desc: 'Produk tidak terbatas, tanpa watermark, custom domain',
      btnText: currentPlan === 'bisnis' ? 'Paket Aktif Saat Ini' : 'Pilih Bisnis',
      disabled: currentPlan === 'bisnis',
      highlight: true,
    },
    {
      id: 'pro',
      name: 'Paket Pro',
      price: 'Rp149.000',
      period: 'per bulan',
      desc: 'Multi-cabang, laporan lanjutan & integrasi tanpa batas',
      btnText: currentPlan === 'pro' ? 'Paket Aktif Saat Ini' : 'Pilih Pro',
      disabled: currentPlan === 'pro',
      highlight: false,
    },
  ]

  const features = [
    {
      name: 'Batas produk',
      values: { gratis: '10 produk', bisnis: 'Tanpa batas', pro: 'Tanpa batas' },
    },
    {
      name: 'Section Web Builder',
      values: { gratis: '3 section', bisnis: 'Semua section', pro: 'Semua section + template premium' },
    },
    {
      name: 'Watermark platform',
      values: { gratis: 'Ada watermark', bisnis: 'Tanpa watermark', pro: 'Tanpa watermark' },
    },
    {
      name: 'Custom domain sendiri',
      values: { gratis: false, bisnis: true, pro: true },
    },
    {
      name: 'Penyimpanan media & foto',
      values: { gratis: '500 MB', bisnis: '5 GB', pro: '20 GB' },
    },
    {
      name: 'Transaksi Kasir POS / bln',
      values: { gratis: '50 transaksi', bisnis: '500 transaksi', pro: 'Tanpa batas' },
    },
    {
      name: 'Laporan keuangan lanjutan & ekspor',
      values: { gratis: false, bisnis: false, pro: true },
    },
    {
      name: 'Multi-cabang & staff kasir',
      values: { gratis: false, bisnis: false, pro: true },
    },
  ]

  return (
    <ModalLayer open={open} onClose={onClose} label="Bandingkan Paket UMKM Builder" backdropLabel="Tutup perbandingan paket">
      <div className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bandingkan Paket UMKM Builder</h2>
            <p className="text-xs text-slate-500">Pilih paket yang sesuai dengan kebutuhan toko Anda.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Content Table */}
        <div className="hide-scrollbar min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain p-3 sm:p-6">
          {/* Card Headers */}
          <div className="grid grid-cols-[minmax(5rem,1.25fr)_repeat(3,minmax(0,1fr))] gap-1 pb-6 border-b border-slate-200 sm:gap-4">
            <div className="flex flex-col justify-end">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fitur & Manfaat</span>
            </div>
            {plans.map((p) => (
              <div
                key={p.id}
                className={`min-w-0 rounded-xl p-2 flex flex-col justify-between sm:p-4 ${
                  p.highlight
                    ? 'border-2 border-brand-700 bg-brand-50/40 relative'
                    : 'border border-slate-200 bg-slate-50/50'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {p.badge}
                  </span>
                )}
                <div>
                  <h3 className="break-words font-bold text-slate-900 text-xs sm:text-sm">{p.name}</h3>
                  <div className="mt-2 flex flex-wrap items-baseline gap-1">
                    <span className="break-all text-base font-extrabold text-slate-900 sm:text-2xl">{p.price}</span>
                    <span className="break-words text-[10px] text-slate-500 sm:text-[11px]">/{p.period}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{p.desc}</p>
                </div>
                <button
                  type="button"
                  disabled={p.disabled}
                  onClick={() => {
                    onClose()
                    onSelectPlan?.(p.id)
                  }}
                  className={`mt-4 w-full min-w-0 whitespace-normal break-words px-1 py-2 text-[10px] rounded-lg font-bold transition sm:px-2 sm:text-xs ${
                    p.disabled
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : p.highlight
                      ? 'btn-primary shadow-sm'
                      : 'btn-secondary'
                  }`}
                >
                  {p.btnText}
                </button>
              </div>
            ))}
          </div>

          {/* Features Comparison Rows */}
          <div className="divide-y divide-slate-100">
            {features.map((f, i) => (
              <div key={i} className="grid grid-cols-[minmax(5rem,1.25fr)_repeat(3,minmax(0,1fr))] items-center gap-1 py-3 text-xs hover:bg-slate-50/60 sm:gap-4 sm:text-sm">
                <span className="min-w-0 break-words font-medium text-slate-700">{f.name}</span>
                {['gratis', 'bisnis', 'pro'].map((planKey) => {
                  const val = f.values[planKey]
                  return (
                    <div key={planKey} className="min-w-0 break-words text-center font-medium">
                      {typeof val === 'boolean' ? (
                        val ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534]">
                            <Check size={13} />
                          </span>
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center text-slate-300">
                            <Minus size={14} />
                          </span>
                        )
                      ) : (
                        <span className={`break-words ${planKey === 'bisnis' ? 'font-semibold text-brand-800' : 'text-slate-800'}`}>
                          {val}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalLayer>
  )
}
