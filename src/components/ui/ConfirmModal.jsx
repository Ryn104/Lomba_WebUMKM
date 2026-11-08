import { useCallback, useRef, useState } from 'react'
import { AlertTriangle, HelpCircle, ShieldAlert, X } from 'lucide-react'
import ModalLayer from './ModalLayer'

const TONES = {
  // Tindakan merusak / tidak bisa dibatalkan
  danger: {
    icon: AlertTriangle,
    tile: 'bg-red-500/15 text-red-500',
    confirm: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  },
  // Tindakan penting tetapi bisa dibalik
  warning: {
    icon: ShieldAlert,
    tile: 'bg-amber-500/15 text-amber-500',
    confirm: 'bg-amber-600 text-white shadow-sm hover:bg-amber-700',
  },
  // Konfirmasi biasa
  info: {
    icon: HelpCircle,
    tile: 'bg-brand-500/15 text-brand-500',
    confirm: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800',
  },
}

const popCss = `
@keyframes cm-pop { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }
.cm-pop { animation: cm-pop .28s cubic-bezier(.2,.7,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .cm-pop { animation: none; } }
`

/** Modal konfirmasi pengganti window.confirm */
export default function ConfirmModal({
  title = 'Konfirmasi',
  message,
  detail,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  tone = 'info',
  onConfirm,
  onCancel,
}) {
  const t = TONES[tone] || TONES.info
  const Icon = t.icon
  // Untuk tindakan berbahaya, fokus awal di "Batal" supaya Enter tidak langsung menghapus
  const focusCancel = tone === 'danger'

  return (
    <ModalLayer open onClose={onCancel} labelledBy="confirm-title" label={title} canClose>
      <style>{popCss}</style>
      <div role="alertdialog" aria-describedby="confirm-message" className="cm-pop relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-6">
          <div className="flex items-start gap-3.5">
            <span className={`shrink-0 rounded-full p-2.5 ${t.tile}`}><Icon size={20} /></span>
            <div className="min-w-0 pt-0.5">
              <h2 id="confirm-title" className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
              <p id="confirm-message" className="mt-1.5 text-sm leading-relaxed text-slate-600">{message}</p>
              {detail && <p className="mt-2 text-xs leading-relaxed text-slate-500">{detail}</p>}
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Tutup" className="-mr-1 shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" autoFocus={focusCancel} onClick={onCancel} className="btn-secondary !rounded-full">{cancelLabel}</button>
          <button
            type="button"
            autoFocus={!focusCancel}
            onClick={onConfirm}
            className={`inline-flex min-w-28 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${t.confirm}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalLayer>
  )
}

export function useConfirm() {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const ask = useCallback((options) => new Promise((resolve) => {
    resolver.current = resolve
    setState(options)
  }), [])

  const finish = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setState(null)
  }

  const dialog = state
    ? <ConfirmModal {...state} onConfirm={() => finish(true)} onCancel={() => finish(false)} />
    : null

  return [ask, dialog]
}