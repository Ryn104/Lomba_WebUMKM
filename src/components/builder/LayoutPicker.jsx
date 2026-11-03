import { useState } from 'react'
import { Check, LayoutGrid, RotateCcw } from 'lucide-react'
import LayoutThumb from '../store-front/layoutThumbs'
import { LAYOUT_OPTIONS, layoutLabel } from '../store-front/sectionDefs'

/**
 * Ubah Layout — ganti variant layout satu section tanpa menyentuh kontennya.
 * • Indikator layout aktif ditampilkan di pojok kanan atas.
 * • Thumbnail = pratinjau struktur sebelum diterapkan; Terapkan baru menulis layout.
 */
export default function LayoutPicker({ type, current, themeLayout, onApply, themeColor = '#0f766e', themeSoft = '#ecfdf5' }) {
  const [picked, setPicked] = useState(current || '')
  const effective = picked || current || themeLayout
  const dirtyPick = picked !== (current || '')

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
          <LayoutGrid size={13} /> Ubah Layout
        </span>
        <span
          className="max-w-[60%] truncate rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800"
          title="Layout yang sedang digunakan section ini"
        >
          {layoutLabel(type, effective)}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Ganti komposisi desain section ini — konten yang sudah diisi tetap dipertahankan.</p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {(LAYOUT_OPTIONS[type] || []).map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setPicked(l.id)}
            className={`rounded-lg border-2 bg-white p-1 text-left transition duration-150 ${
              picked === l.id ? 'border-brand-600 ring-2 ring-brand-100' : 'border-transparent hover:border-slate-300'
            }`}
            title={`${l.label} — klik untuk mempratinjau`}
          >
            <LayoutThumb type={type} layout={l.id} color={themeColor} soft={themeSoft} className="h-14 w-full rounded border border-slate-100" />
            <span className="mt-1 block truncate text-[10px] font-semibold text-slate-600">{l.label}</span>
          </button>
        ))}
      </div>

      {dirtyPick && (
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => setPicked(current || '')} className="btn-ghost px-2 py-1.5 text-xs">
            <RotateCcw size={13} /> Batal
          </button>
          <button type="button" onClick={() => onApply(picked)} className="btn-primary flex-1 justify-center px-2 py-1.5 text-xs font-bold">
            <Check size={14} /> Terapkan Layout
          </button>
        </div>
      )}
    </div>
  )
}
