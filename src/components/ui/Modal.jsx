import { X } from 'lucide-react'
import ModalLayer from './ModalLayer'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <ModalLayer open={open} onClose={onClose} label={title}>
      <div className={`relative z-10 flex w-full ${widths[size]} max-h-[90vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 text-slate-900">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
      </div>
    </ModalLayer>
  )
}
