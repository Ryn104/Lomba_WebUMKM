import { useState } from 'react'
import { X } from 'lucide-react'
import ModalLayer from '../ui/ModalLayer'

const PLANS = [
  { value: 'basic', label: 'Basic' },
  { value: 'bisnis', label: 'Bisnis' },
  { value: 'pro', label: 'Pro' },
]

export default function SubscriptionAdminModal({ store, saving, onClose, onSave }) {
  const currentSubscription = store.theme?.subscription || {}
  const [plan, setPlan] = useState(['basic', 'bisnis', 'pro'].includes(currentSubscription.plan) ? currentSubscription.plan : 'basic')
  const [renewalDate, setRenewalDate] = useState(currentSubscription.renewsAt ? currentSubscription.renewsAt.slice(0, 10) : '')

  return (
    <ModalLayer open onClose={onClose} labelledBy="admin-subscription-title" label="Kelola langganan" canClose={!saving}>
      <form
        className="ad-pop relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault()
          onSave({ plan, renewalDate })
        }}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">Langganan</p>
            <h2 id="admin-subscription-title" className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">Kelola langganan</h2>
            <p className="mt-1 text-sm text-slate-500">{store.name} · {store.profiles?.email || 'Pemilik toko'}</p>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <span className="text-sm font-semibold text-slate-800">Paket toko</span>
            <div role="radiogroup" aria-label="Paket toko" className="mt-2 grid grid-cols-3 gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 p-1">
              {PLANS.map((p) => {
                const active = plan === p.value
                return (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPlan(p.value)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                      active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-500/10 hover:text-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Akses berlaku sampai</span>
            <input
              className="input mt-2"
              type="date"
              min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}
              value={renewalDate}
              onChange={(event) => setRenewalDate(event.target.value)}
            />
            <span className="mt-1 block text-xs text-slate-500">Kosongkan untuk akses tanpa batas waktu (complimentary permanen).</span>
          </label>

          <p className="rounded-xl border border-slate-500/20 bg-slate-500/10 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
            Perubahan paket langsung diterapkan pada fitur toko. Pengelolaan ini tidak membuat tagihan atau invoice.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" disabled={saving} onClick={onClose} className="btn-secondary !rounded-full">Batal</button>
          <button type="submit" disabled={saving} className="btn-primary min-w-32 justify-center !rounded-full disabled:opacity-60">
            {saving ? 'Menyimpan…' : 'Simpan paket'}
          </button>
        </div>
      </form>
    </ModalLayer>
  )
}
