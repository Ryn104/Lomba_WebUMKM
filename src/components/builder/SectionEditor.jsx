import { useState } from 'react'
import { Link } from 'react-router-dom'
import ImageUpload from '../ui/ImageUpload'
import { LAYOUT_OPTIONS, SECTION_TYPES } from '../store-front/sectionDefs'
import LayoutPicker from './LayoutPicker'
import { Plus, Trash2, MapPin, X } from 'lucide-react'
import LocationPicker from './LocationPicker'

/** Panel kustomisasi untuk satu section yang sedang dipilih */
export default function SectionEditor({ section, onChange, store, themeLayout, themeColor, themeSoft }) {
  const def = SECTION_TYPES[section.type]
  const c = section.content
  const set = (key, val) => onChange({ ...c, [key]: val })
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-bold text-slate-900">
        <def.icon size={18} className="text-brand-700" /> {def.label}
      </h3>
      {def.layoutsSupported !== false && LAYOUT_OPTIONS[section.type] && (
        <LayoutPicker
          key={`${section.id}:${section.content?.layout || ''}`}
          type={section.type}
          current={section.content?.layout || ''}
          themeLayout={themeLayout}
          themeColor={themeColor}
          themeSoft={themeSoft}
          onApply={(id) => onChange({ ...c, layout: id })}
        />
      )}
      {def.note && <p className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs text-brand-800">{def.note}</p>}

      {def.fields.map((f) => (
        <div key={f.key}>
          <label className="label">{f.label}</label>

          {f.type === 'text' && f.key === 'phone' && (
            <>
              <p className="mb-1 text-xs text-slate-500">
                Nomor ini diambil dari profil akun Anda.{' '}
                <Link to="/account/profile" className="font-semibold text-brand-700 hover:underline">Ubah di Profil Saya</Link>
              </p>
              <input className="input cursor-not-allowed bg-slate-100 text-slate-600" disabled value={store?.whatsapp || 'Belum diatur'} />
            </>
          )}

          {f.type === 'text' && f.key !== 'phone' && (
            <input
              className="input"
              value={c[f.key] ?? ''}
              placeholder={f.key === 'email' ? 'nama@email.com' : f.key === 'mapUrl' ? 'https://maps.google.com/...' : `Masukkan ${f.label.toLowerCase()}`}
              onChange={(e) => set(f.key, e.target.value)}
            />
          )}

          {f.type === 'textarea' && (
            <textarea rows={4} className="input" value={c[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={`Masukkan ${f.label.toLowerCase()}...`} />
          )}

          {f.type === 'number' && (
            <input type="number" min={1} className="input" placeholder="Contoh: 8" value={c[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value === '' ? '' : Number(e.target.value))} />
          )}

          {f.type === 'color' && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={c[f.key] || '#ffffff'}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 p-0.5"
              />
              <input className="input font-mono" placeholder="#047857" value={c[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
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
                    placeholder="Nama pelanggan"
                    value={t.name}
                    onChange={(e) => set(f.key, c[f.key].map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                  <textarea
                    rows={2}
                    className="input"
                    placeholder="Ceritakan pengalaman pelanggan..."
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

          {f.type === 'location' && (
            <div className="space-y-2">
              {c.lat != null && c.lng != null ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                    <MapPin size={14} className="text-brand-600" /> {c.lat.toFixed(6)}, {c.lng.toFixed(6)}
                  </span>
                  <div className="flex gap-1">
                    <button type="button" className="text-xs font-semibold text-brand-600" onClick={() => setPickerOpen(true)}>Ubah</button>
                    <button type="button" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500" onClick={() => onChange({ ...c, lat: null, lng: null })}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-secondary w-full" onClick={() => setPickerOpen(true)}>
                  <MapPin size={14} /> Pilih Lokasi di Peta
                </button>
              )}
            </div>
          )}

          {f.hint && <p className="mt-1 text-xs text-slate-400">{f.hint}</p>}
        </div>
      ))}
      <LocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initial={c.lat != null && c.lng != null ? [c.lat, c.lng] : null}
        onSave={(pos) => {
          onChange({ ...c, lat: pos[0], lng: pos[1] })
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
