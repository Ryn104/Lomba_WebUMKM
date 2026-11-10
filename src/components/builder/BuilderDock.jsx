import { useTheme } from '../../context/ThemeContext'

const NOTCH_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 64'%3E%3Cpath d='M0 0H13Q23 0 23 7A37 37 0 0 0 97 7Q97 0 107 0H120V64H0Z'/%3E%3C/svg%3E\")"
const MASK_IMAGE = `linear-gradient(#000,#000), linear-gradient(#000,#000), ${NOTCH_SVG}`
const MASK_SIZE = 'calc(50% - 59px) 100%, calc(50% - 59px) 100%, 120px 64px'
const MASK_POSITION = 'left top, right top, center top'
const MASK_STYLE = {
  maskImage: MASK_IMAGE,
  WebkitMaskImage: MASK_IMAGE,
  maskSize: MASK_SIZE,
  WebkitMaskSize: MASK_SIZE,
  maskPosition: MASK_POSITION,
  WebkitMaskPosition: MASK_POSITION,
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
}

const THEMES = {
  dark: { dockFill: 'bg-[#0F1A2E]/85', dockIdle: 'text-[#B4BFCE]', dockBorder: 'text-white/15' },
  light: { dockFill: 'bg-white/75', dockIdle: 'text-[#64748B]', dockBorder: 'text-slate-900/10' },
}

const DockItem = ({ tab, active, onClick, t }) => {
  const Icon = tab.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tab.label}
      title={tab.label}
      aria-current={active ? 'page' : undefined}
      className="group flex min-w-0 flex-1 items-center justify-center"
    >
      <span
        className={`flex h-10 w-12 items-center justify-center rounded-xl transition-all duration-300 group-active:scale-90 ${
          active ? 'bg-brand-500/15 text-brand-500' : t.dockIdle
        }`}
      >
        <Icon size={20} />
      </span>
    </button>
  )
}

export default function BuilderDock({ tabs, active, onChange }) {
  const { isDark } = useTheme()
  const t = isDark ? THEMES.dark : THEMES.light
  const [left, center, right] = tabs
  const CenterIcon = center.icon
  const centerActive = active === center.id

  return (
    <nav
      aria-label="Panel builder"
      className="fixed inset-x-3 z-50 h-16 lg:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ filter: 'drop-shadow(0 8px 14px rgb(2 6 23))' }}>
        <div className="absolute inset-0 rounded-[26px] bg-slate-900/[0.14]" style={MASK_STYLE} />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 rounded-[26px] backdrop-blur-2xl backdrop-saturate-150 ${t.dockFill}`}
        style={MASK_STYLE}
      />

      <div className={`pointer-events-none absolute inset-0 flex ${t.dockBorder}`} aria-hidden="true">
        <div className="w-[calc(50%-60px)] rounded-l-[26px] border-y border-l border-current" />
        <svg className="h-full w-[120px] shrink-0" viewBox="0 0 120 64" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M0 .5H13Q23 .5 23 7A37 37 0 0 0 97 7Q97 .5 107 .5H120M0 63.5H120" />
        </svg>
        <div className="flex-1 rounded-r-[26px] border-y border-r border-current" />
      </div>

      <div className="relative z-10 flex h-full items-center px-1">
        <div className="flex flex-1 items-center">
          <DockItem tab={left} active={active === left.id} onClick={() => onChange(left.id)} t={t} />
        </div>
        <div className="w-[92px] shrink-0" aria-hidden="true" />
        <div className="flex flex-1 items-center">
          <DockItem tab={right} active={active === right.id} onClick={() => onChange(right.id)} t={t} />
        </div>
      </div>

      <div className="absolute left-1/2 top-[-30px] z-10 h-[74px] w-[74px] -translate-x-1/2">
        <button
          type="button"
          onClick={() => onChange(center.id)}
          aria-label={center.label}
          title={center.label}
          aria-current={centerActive ? 'page' : undefined}
          className={`absolute inset-[9px] flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-sky-400 text-white shadow-lg shadow-brand-700/30 transition active:scale-90 ${
            centerActive ? 'ring-4 ring-brand-500/30' : ''
          }`}
        >
          <CenterIcon size={24} />
        </button>
      </div>
    </nav>
  )
}