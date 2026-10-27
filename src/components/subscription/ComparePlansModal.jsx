import { X, Check, Minus } from 'lucide-react'
import { rupiah } from '../../lib/utils'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
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
        <div className="p-6 overflow-x-auto">
          {/* Card Headers */}
          <div className="grid grid-cols-4 gap-4 min-w-[650px] pb-6 border-b border-slate-200">
            <div className="flex flex-col justify-end">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fitur & Manfaat</span>
            </div>
            {plans.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl p-4 flex flex-col justify-between ${
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
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">{p.price}</span>
                    <span className="text-[11px] text-slate-500">/{p.period}</span>
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
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition ${
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
          <div className="min-w-[650px] divide-y divide-slate-100">
            {features.map((f, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-3 text-sm items-center hover:bg-slate-50/60">
                <span className="font-medium text-slate-700">{f.name}</span>
                {['gratis', 'bisnis', 'pro'].map((planKey) => {
                  const val = f.values[planKey]
                  return (
                    <div key={planKey} className="text-center font-medium">
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
                        <span className={planKey === 'bisnis' ? 'text-brand-800 font-semibold' : 'text-slate-800'}>
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
    </div>
  )
}
