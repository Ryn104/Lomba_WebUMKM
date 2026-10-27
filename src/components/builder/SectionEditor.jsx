import { Plus, Trash2 } from 'lucide-react'
import ImageUpload from '../ui/ImageUpload'
import { SECTION_TYPES } from '../store-front/sectionDefs'
import { sanitizePhone } from '../../lib/utils'

/** Panel kustomisasi untuk satu section yang sedang dipilih */
export default function SectionEditor({ section, onChange }) {
  const def = SECTION_TYPES[section.type]
  const c = section.content
  const set = (key, val) => onChange({ ...c, [key]: val })

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-bold text-slate-900">
        <def.icon size={18} className="text-brand-700" /> {def.label}
      </h3>
      {def.note && <p className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs text-brand-800">{def.note}</p>}

      {def.fields.map((f) => (
        <div key={f.key}>
          <label className="label">{f.label}</label>

          {f.type === 'text' && (
            <input
              className="input"
              value={c[f.key] ?? ''}
              onChange={(e) => set(f.key, f.key === 'phone' ? sanitizePhone(e.target.value) : e.target.value)}
              inputMode={f.key === 'phone' ? 'numeric' : undefined}
              maxLength={f.key === 'phone' ? 13 : undefined}
            />
          )}

          {f.type === 'textarea' && (
            <textarea rows={4} className="input" value={c[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
          )}

          {f.type === 'number' && (
            <input type="number" min={1} className="input" value={c[f.key] ?? ''} onChange={(e) => set(f.key, Number(e.target.value))} />
          )}

          {f.type === 'color' && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={c[f.key] || '#ffffff'}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 p-0.5"
              />
              <input className="input font-mono" value={c[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
            </div>
          )}

          {f.type === 'select' && (
            <select
              className="input"
              value={c[f.key]}
              onChange={(e) => set(f.key, f.number ? Number(e.target.value) : e.target.value)}
            >
              {f.options.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          )}

          {f.type === 'image' && <ImageUpload value={c[f.key]} onChange={(v) => set(f.key, v)} folder="sections" className="h-28 w-40" />}

          {f.type === 'images' && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {(c[f.key] || []).map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => set(f.key, c[f.key].filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 rounded bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <ImageUpload value="" onChange={(v) => v && set(f.key, [...(c[f.key] || []), v])} folder="gallery" className="h-20 w-20" />
            </div>
          )}

          {f.type === 'testimonials' && (
            <div className="space-y-3">
              {(c[f.key] || []).map((t, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <input
                    className="input"
                    placeholder="Nama"
                    value={t.name}
                    onChange={(e) => set(f.key, c[f.key].map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                  <textarea
                    rows={2}
                    className="input"
                    placeholder="Isi testimoni"
                    value={t.text}
                    onChange={(e) => set(f.key, c[f.key].map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                  />
                  <button className="text-xs text-red-600 hover:text-red-700 hover:underline" onClick={() => set(f.key, c[f.key].filter((_, j) => j !== i))}>
                    Hapus
                  </button>
                </div>
              ))}
              <button className="btn-secondary w-full" onClick={() => set(f.key, [...(c[f.key] || []), { name: '', text: '' }])}>
                <Plus size={14} /> Tambah testimoni
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
