import { Plus, Trash2 } from 'lucide-react'
import { SOCIAL_PLATFORMS, SOCIAL_BY_ID } from '../store-front/socialPlatforms'

export default function SocialLinksEditor({ value, onChange }) {
  const items = value || []
  const update = (i, patch) => onChange(items.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => {
    const used = new Set(items.map((s) => s.type))
    const next = SOCIAL_PLATFORMS.find((p) => !used.has(p.id)) || SOCIAL_PLATFORMS[0]
    onChange([...items, { type: next.id, value: '' }])
  }

  return (
    <div>
      <p className="label">Media sosial</p>
      <div className="space-y-2">
        {items.map((s, i) => {
          const Icon = SOCIAL_BY_ID[s.type]?.icon
          return (
            <div key={i} className="rounded-lg border border-slate-200 p-2">
              <div className="flex items-center gap-2">
                {Icon && <Icon size={16} className="shrink-0 text-slate-500" />}
                <select className="input" value={s.type} onChange={(e) => update(i, { type: e.target.value })} aria-label="Platform">
                  {SOCIAL_PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <button type="button" onClick={() => remove(i)} aria-label="Hapus" className="shrink-0 rounded p-1.5 text-red-600 hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>
              <input
                className="input mt-2"
                placeholder={s.type === 'website' ? 'https://...' : '@username atau link profil'}
                value={s.value}
                onChange={(e) => update(i, { value: e.target.value })}
              />
            </div>
          )
        })}
      </div>
      <button type="button" className="btn-secondary mt-2 w-full justify-center" onClick={add}>
        <Plus size={16} /> Tambah media sosial
      </button>
    </div>
  )
}