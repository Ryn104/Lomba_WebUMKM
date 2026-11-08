import { CATEGORY_ICON_MAP, CATEGORY_ICON_GROUPS } from '../store-front/categoryIcons'

export default function CategoryIconPicker({ value, onChange }) {
  return (
    <div
      className="max-h-56 space-y-3 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 p-2"
      role="radiogroup"
      aria-label="Pilih ikon kategori"
    >
      {CATEGORY_ICON_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{group.label}</p>
          <div className="grid grid-cols-6 gap-1.5">
            {group.keys.map((key) => {
              const Icon = CATEGORY_ICON_MAP[key]
              if (!Icon) return null
              const active = value === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={key}
                  onClick={() => onChange(key)}
                  className={`grid h-9 place-items-center rounded-lg border transition ${
                    active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <Icon size={18} />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}