import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const OPTIONS = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
]

/** Pilihan tema 3 opsi. variant="sidebar" untuk menu gelap di sidebar dashboard. */
export function ThemeSegmented({ variant = 'default' }) {
  const { theme, setTheme } = useTheme()
  const onDarkMenu = variant === 'sidebar'

  return (
    <div role="radiogroup" aria-label="Tampilan" className={`grid grid-cols-3 gap-1 rounded-lg p-1 ${onDarkMenu ? 'bg-slate-900' : 'bg-slate-100'}`}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        const tone = active
          ? (onDarkMenu ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
          : (onDarkMenu ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={`flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${tone}`}
          >
            <Icon size={15} /> {label}
          </button>
        )
      })}
    </div>
  )
}

/** Tombol ikon terang/gelap untuk pengunjung yang belum login */
export function ThemeIconButton({ className = '' }) {
  const { isDark, setTheme } = useTheme()
  const label = isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'
  return (
    <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label={label} title={label} className={`btn-ghost px-2.5 ${className}`}>
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}