import { useEffect, useState } from 'react'
import { Check, CreditCard, Landmark, QrCode, Smartphone, X } from 'lucide-react'
import { rupiah } from '../../lib/utils'
import ModalLayer from '../ui/ModalLayer'

const paymentMethods = [
  { id: 'qris', label: 'QRIS', detail: 'Pindai melalui aplikasi bank atau e-wallet', icon: QrCode },
  { id: 'transfer', label: 'Transfer bank', detail: 'BCA, Mandiri, BNI, atau BRI', icon: Landmark },
  { id: 'ewallet', label: 'E-wallet', detail: 'GoPay, OVO, DANA, atau ShopeePay', icon: Smartphone },
]

export default function UpgradeModal({ open, onClose, targetPlan = 'bisnis', currentPeriod = 'monthly', onSuccess }) {
  const [period, setPeriod] = useState(currentPeriod === 'yearly' ? 'yearly' : 'monthly')
  const [method, setMethod] = useState('qris')
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState('checkout')
  const isPro = targetPlan === 'pro'
  const planName = isPro ? 'Paket Pro' : 'Paket Bisnis'
  const monthlyPrice = isPro ? 149000 : 79000
  const yearlyMonthlyPrice = isPro ? 119000 : 63000
  const total = period === 'yearly' ? yearlyMonthlyPrice * 12 : monthlyPrice
  const selectedMethod = paymentMethods.find((item) => item.id === method)

  useEffect(() => {
    if (open) {
      setPeriod(currentPeriod === 'yearly' ? 'yearly' : 'monthly')
      setMethod('qris')
      setProcessing(false)
      setStep('checkout')
    }
  }, [open, currentPeriod])

  if (!open) return null

  const confirmSubscription = async () => {
    if (processing) return
    setProcessing(true)
    try {
      const activated = await onSuccess?.({
        targetPlan,
        period,
        method: selectedMethod?.label || 'QRIS',
        amount: total,
      })
      if (activated !== false) setStep('success')
    } catch (error) {
      console.error('Subscription activation failed', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ModalLayer open={open} onClose={onClose} labelledBy="upgrade-title" label="Berlangganan" canClose={!processing}>
      <div className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="upgrade-title" className="text-xl font-bold text-slate-900">Berlangganan {planName}</h2>
            <p className="mt-1 text-sm text-slate-500">Pilih periode dan metode pembayaran untuk melanjutkan.</p>
          </div>
          <button type="button" onClick={onClose} disabled={processing} aria-label="Tutup" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {step === 'checkout' ? (
        <div className="hide-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain p-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-800">Periode langganan</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { id: 'monthly', name: 'Bulanan', price: monthlyPrice, caption: 'Ditagih setiap bulan' },
                { id: 'yearly', name: 'Tahunan', price: yearlyMonthlyPrice, caption: `Ditagih ${rupiah(yearlyMonthlyPrice * 12)} per tahun`, badge: 'Hemat 20%' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={period === option.id}
                  onClick={() => setPeriod(option.id)}
                  className={`relative rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 ${period === option.id ? 'border-brand-700 bg-brand-50/50 ring-1 ring-brand-700' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  {option.badge && <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{option.badge}</span>}
                  <span className="block text-sm font-semibold text-slate-900">{option.name}</span>
                  <span className="mt-1 block text-lg font-bold text-slate-900">{rupiah(option.price)} <span className="text-xs font-normal text-slate-500">/ bulan</span></span>
                  <span className="mt-1 block text-xs text-slate-500">{option.caption}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-800">Metode pembayaran</h3>
            <div className="mt-3 space-y-2">
              {paymentMethods.map(({ id, label, detail, icon: Icon }) => (
                <label key={id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${method === id ? 'border-brand-700 bg-brand-50/40 ring-1 ring-brand-700' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="flex items-center gap-3">
                    <span className="rounded-lg bg-slate-100 p-2 text-slate-700"><Icon size={18} /></span>
                    <span><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{detail}</span></span>
                  </span>
                  <input type="radio" name="subscription-payment-method" value={id} checked={method === id} onChange={() => setMethod(id)} className="h-4 w-4 accent-emerald-700" />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{planName} · {period === 'yearly' ? 'Tahunan' : 'Bulanan'}</span>
              <span>{rupiah(total)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="font-semibold text-slate-900">Total pembayaran</span>
              <span className="text-xl font-extrabold text-brand-700">{rupiah(total)}</span>
            </div>
          </section>

          <button type="button" onClick={confirmSubscription} disabled={processing} className="btn-primary flex w-full justify-center py-3 font-bold shadow-sm disabled:cursor-wait disabled:opacity-70">
            {processing ? 'Memproses…' : <><CreditCard size={17} /> Konfirmasi pembayaran</>}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500"><Check size={14} className="text-emerald-700" /> Akses paket dimulai setelah konfirmasi.</p>
        </div>
        ) : (
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={28} /></span>
            <h3 className="mt-4 text-xl font-bold text-slate-900">Langganan berhasil</h3>
            <p className="mt-2 text-sm text-slate-600">{planName} sekarang aktif untuk toko Anda.</p>
            <p className="mt-1 text-xs text-slate-500">Metode pembayaran: {selectedMethod?.label}</p>
            <button type="button" onClick={onClose} className="btn-primary mt-6 w-full justify-center py-2.5 font-bold">Selesai</button>
          </div>
        )}
      </div>
    </ModalLayer>
  )
}
