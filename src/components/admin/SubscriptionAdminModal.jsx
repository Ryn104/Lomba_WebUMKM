import { useState } from 'react'
import { X } from 'lucide-react'
import ModalLayer from '../ui/ModalLayer'

export default function SubscriptionAdminModal({ store, saving, onClose, onSave }) {
  const currentSubscription = store.theme?.subscription || {}
  const [plan, setPlan] = useState(['gratis', 'bisnis', 'pro'].includes(currentSubscription.plan) ? currentSubscription.plan : 'gratis')
  const [renewalDate, setRenewalDate] = useState(currentSubscription.renewsAt ? currentSubscription.renewsAt.slice(0, 10) : '')
  const isPaid = plan !== 'gratis'

  return (
    <ModalLayer open onClose={onClose} labelledBy="admin-subscription-title" label="Kelola langganan" canClose={!saving}>
      <form
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault()
          onSave({ plan, renewalDate })
        }}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="admin-subscription-title" className="text-lg font-bold text-slate-900">Kelola langganan</h2>
            <p className="mt-1 text-sm text-slate-500">{store.name} · {store.profiles?.email || 'Pemilik toko'}</p>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Paket toko</span>
            <select className="input mt-2" value={plan} onChange={(event) => setPlan(event.target.value)}>
              <option value="gratis">Gratis</option>
              <option value="bisnis">Bisnis</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          {isPaid && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Akses berlaku sampai</span>
              <input
                className="input mt-2"
                type="date"
                min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })}
                value={renewalDate}
                onChange={(event) => setRenewalDate(event.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-500">Kosongkan untuk akses tanpa batas waktu.</span>
            </label>
          )}
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
            Perubahan paket langsung diterapkan pada fitur toko. Pengelolaan ini tidak membuat tagihan atau invoice.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" disabled={saving} onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={saving} className="btn-primary min-w-32 justify-center disabled:opacity-60">
            {saving ? 'Menyimpan…' : 'Simpan paket'}
          </button>
        </div>
      </form>
    </ModalLayer>
  )
}